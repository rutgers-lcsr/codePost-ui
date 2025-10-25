import * as t from 'io-ts';
import { deleteObject, GenericObject, readObject, readObjectDetail, updateObject } from './generics';

const AssignmentDataSetV = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      description: t.string,
      file: t.string,
      mount_path: t.string,
      is_active: t.boolean,
    }),
    t.partial({
      file_url: t.string,
      file_size: t.number,
      file_name: t.string,
    }),
  ],
  'AssignmentDataSet',
);

const AssignmentDataSetVPost = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      file: t.any, // File object
    }),
    t.partial({
      description: t.string,
      mount_path: t.string,
      is_active: t.boolean,
    }),
  ],
  'AssignmentDataSetPost',
);

const AssignmentDataSetVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      description: t.string,
      mount_path: t.string,
      is_active: t.boolean,
    }),
  ],
  'AssignmentDataSetPatch',
);

export type AssignmentDataSetType = t.TypeOf<typeof AssignmentDataSetV>;
export type AssignmentDataSetPostType = t.TypeOf<typeof AssignmentDataSetVPost>;
export type AssignmentDataSetPatchType = t.TypeOf<typeof AssignmentDataSetVPatch>;

export class AssignmentDataSet {
  public static create = async (data: FormData): Promise<AssignmentDataSetType> => {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${process.env.REACT_APP_API_URL}/assignmentDataSets/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create dataset: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const decoded = AssignmentDataSetV.decode(result);
    if (decoded._tag === 'Left') {
      throw new Error(`Invalid response: ${JSON.stringify(decoded.left)}`);
    }
    return decoded.right;
  };

  public static read = readObject(AssignmentDataSetV, 'assignmentDataSets');
  public static update = updateObject(AssignmentDataSetV, AssignmentDataSetVPatch, 'assignmentDataSets');
  public static delete = deleteObject(AssignmentDataSetV, 'assignmentDataSets');

  // List datasets for an assignment using the assignment detail endpoint
  public static listByAssignment = readObjectDetail(t.array(AssignmentDataSetV), 'assignments', 'datasets');

  public static downloadUrl = (id: number): string => {
    return `${process.env.REACT_APP_API_URL}/assignmentDataSets/${id}/download/`;
  };
}
