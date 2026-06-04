// src/modules/projects/project.service.ts
import { Types, SortOrder } from 'mongoose';
import Project, { IProject } from '../../models/Project.model';
import { ApiError }           from '../../utils/ApiError';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from './project.validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PaginatedProjects {
  projects: IProject[];
  total:    number;
  page:     number;
  limit:    number;
  totalPages: number;
}

// Fields exposed when populating the owner — never include password hash
const OWNER_SELECT  = 'name email avatar';
const MEMBER_SELECT = 'name email avatar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ID: "${id}"`);
  }
  return new Types.ObjectId(id);
}

/**
 * Verify the project exists and that the requesting user is the owner.
 * Returns the project document on success; throws otherwise.
 */
async function getProjectAsOwner(
  projectId: string,
  requesterId: string
): Promise<IProject> {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.owner.toString() !== requesterId) {
    throw ApiError.forbidden('Only the project owner can perform this action');
  }

  return project;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------
async function create(
  data: CreateProjectInput,
  ownerId: string
): Promise<IProject> {
  const ownerObjectId = toObjectId(ownerId);

  // Resolve member user IDs — deduplicate and exclude the owner
  const members = (data.members ?? [])
    .filter((m) => m.user !== ownerId)
    .map((m) => ({
      user:     toObjectId(m.user),
      role:     m.role,
      joinedAt: new Date(),
    }));

  // Deduplicate on user field (last entry wins)
  const seen      = new Set<string>();
  const dedupedMembers = [...members].reverse().filter((m) => {
    const key = m.user.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).reverse();

  const project = await Project.create({
    name:        data.name,
    description: data.description,
    progress:    data.progress ?? 0,
    owner:       ownerObjectId,
    members:     dedupedMembers,
  });

  return project.populate([
    { path: 'owner',          select: OWNER_SELECT },
    { path: 'members.user',   select: MEMBER_SELECT },
  ]);
}

async function list(
  requesterId: string,
  query: ListProjectsQuery
): Promise<PaginatedProjects> {
  const { status, page, limit, search, sortBy, sortDir } = query;

  const requesterObjectId = toObjectId(requesterId);

  // Match projects where user is owner OR a member
  const filter: Record<string, unknown> = {
    $or: [
      { owner: requesterObjectId },
      { 'members.user': requesterObjectId },
    ],
  };

  if (status)  filter['status'] = status;
  if (search)  filter['$text'] = { $search: search };

  const sortField = sortBy   ?? 'createdAt';
  const sortOrder: SortOrder = sortDir === 'asc' ? 1 : -1;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner',        OWNER_SELECT)
      .populate('members.user', MEMBER_SELECT)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return {
    projects: projects as unknown as IProject[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getById(
  projectId: string,
  requesterId: string
): Promise<IProject> {
  const project = await Project.findById(projectId)
    .populate('owner',        OWNER_SELECT)
    .populate('members.user', MEMBER_SELECT);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Access check: owner or member
  const isOwner  = project.owner._id?.toString() === requesterId
                || project.owner.toString()        === requesterId;
  const isMember = project.members.some((m: IProject['members'][number]) => {
    const memberUser = m.user as unknown as { _id?: Types.ObjectId };
    return m.user.toString() === requesterId ||
           memberUser?._id?.toString() === requesterId;
  });

  if (!isOwner && !isMember) {
    throw ApiError.forbidden('You do not have access to this project');
  }

  return project;
}

async function update(
  projectId: string,
  data: UpdateProjectInput,
  requesterId: string
): Promise<IProject> {
  const project = await getProjectAsOwner(projectId, requesterId);

  if (data.name        !== undefined) project.name        = data.name;
  if (data.description !== undefined) project.description = data.description;
  if (data.progress    !== undefined) project.progress    = data.progress;

  if (data.members !== undefined) {
    const ownerStr = requesterId;
    const deduped  = new Map<string, { user: Types.ObjectId; role: 'editor' | 'viewer'; joinedAt: Date }>();

    for (const m of data.members) {
      if (m.user === ownerStr) continue; // owner cannot be a member
      deduped.set(m.user, {
        user:     toObjectId(m.user),
        role:     m.role,
        joinedAt: new Date(),
      });
    }

    project.members = [...deduped.values()] as IProject['members'];
  }

  await project.save();

  return project.populate([
    { path: 'owner',        select: OWNER_SELECT },
    { path: 'members.user', select: MEMBER_SELECT },
  ]);
}

async function archive(
  projectId: string,
  requesterId: string
): Promise<IProject> {
  const project = await getProjectAsOwner(projectId, requesterId);

  if (project.status === 'archived') {
    throw ApiError.badRequest('Project is already archived');
  }

  project.status = 'archived';
  await project.save();

  return project.populate([
    { path: 'owner',        select: OWNER_SELECT },
    { path: 'members.user', select: MEMBER_SELECT },
  ]);
}

async function remove(
  projectId: string,
  requesterId: string
): Promise<void> {
  await getProjectAsOwner(projectId, requesterId);
  await Project.findByIdAndDelete(projectId);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const projectService = { create, list, getById, update, archive, remove };
export default projectService;