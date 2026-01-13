import * as t from 'io-ts';
import {
  GenericObject,
  createObject,
  deleteObject,
  readObject,
  updateObject,
  getHeaders,
  handleErrorResponse,
} from './generics';

export const CommentTemplateV = t.intersection(
  [
    GenericObject,
    t.type({
      text: t.string,
      isGlobal: t.boolean,
    }),
    t.partial({
      owner: t.string,
      assignment: t.number,
      filePath: t.union([t.string, t.null]),
      pointDelta: t.union([t.number, t.null]),
      rubricComment: t.union([t.number, t.null]),
      sourceComment: t.union([t.number, t.null]),
      cellId: t.union([t.string, t.null]),
    }),
  ],
  'CommentTemplate',
);

export const CommentTemplatePostV = t.intersection(
  [
    t.type({
      text: t.string,
      isGlobal: t.boolean,
    }),
    t.partial({
      owner: t.string,
      assignment: t.number,
      filePath: t.union([t.string, t.null]),
      pointDelta: t.union([t.number, t.null]),
      rubricComment: t.union([t.number, t.null]),
      sourceComment: t.union([t.number, t.null]),
      cellId: t.union([t.string, t.null]),
    }),
  ],
  'CommentTemplatePost',
);

export type CommentTemplateType = t.TypeOf<typeof CommentTemplateV>;

export class CommentTemplateIO {
  public static create = createObject(CommentTemplateV, CommentTemplatePostV, 'commentTemplates');
  public static read = readObject(CommentTemplateV, 'commentTemplates');
  public static update = updateObject(CommentTemplateV, CommentTemplateV, 'commentTemplates');
  public static delete = deleteObject(CommentTemplateV, 'commentTemplates');

  public static list = async (assignmentId: number): Promise<CommentTemplateType[]> => {
    let objects: CommentTemplateType[] = [];
    let url: string | null = `${process.env.REACT_APP_API_URL}/commentTemplates/?assignment=${assignmentId}`;

    while (url !== null) {
      const res = await fetch(url, {
        headers: getHeaders(),
        method: 'GET',
      });

      if (res.status === 200) {
        const data: any = await res.json();

        if (Object.prototype.hasOwnProperty.call(data, 'results')) {
          objects = objects.concat(data['results']);
        } else {
          objects = data;
          url = null;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'next')) {
          url = data['next'];
        } else {
          url = null;
        }
      } else {
        await handleErrorResponse(res);
        url = null;
      }
    }
    return objects;
  };
}
