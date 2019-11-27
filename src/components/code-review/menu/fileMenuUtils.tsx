import * as React from 'react';

import { Icon, Menu } from 'antd';

const { SubMenu } = Menu;

export interface IFolder<T> {
  files: T[];
  folders: IFolder<T>[];
  name: string;
}
export interface IDirectoryStructure<T> {
  files: T[]; // Files without a path specified
  folders: IFolder<T>[];
}

interface IBasicFile {
  name: string;
  code: string;
  id: number;
  path: string | null;
}

// Create a nested directory corresponding to the folder and file structure
export function createDirectoryStructure<T extends IBasicFile>(files: T[]) {
  const root: IDirectoryStructure<T> = { folders: [], files: [] };

  // Search through a list of folders match with same name
  const search = (nameKey: string, folderList: IFolder<T>[]) => {
    for (const i of folderList) {
      if (i['name'] === nameKey) {
        return i;
      }
    }
    return false;
  };
  // Loop through files and process them
  files.forEach((f) => {
    if (!f.path) {
      // If no path specified, add them to root.files
      root.files.push(f);
    } else {
      // remove starting and trailing slashes
      const cleanedPath = f.path.replace(/^\/+|\/+$/g, '');
      const dirs = cleanedPath.split('/');
      dirs.reduce((acc, dirName, index) => {
        const el = search(dirName, acc['folders']);
        if (el) {
          if (index === dirs.length - 1) {
            // Reached the last directory in the path, so push the file
            el['files'].push(f);
          }
          return el;
        } else {
          acc['folders'].push({
            name: dirName,
            folders: [],
            files: index === dirs.length - 1 ? [f] : [],
          });
          return acc['folders'][acc['folders'].length - 1];
        }
      }, root);
    }
  });
  return root;
}

export function buildFolderMenu<T extends IBasicFile>(
  parentPath: string,
  folder: { name: string; files: T[]; folders: IFolder<T>[] },
  buildFileMenu: (files: T[]) => React.ReactElement[],
  className?: string,
) {
  const fileItems = buildFileMenu(folder.files);
  return (
    <SubMenu
      key={`${parentPath}/${folder.name}`}
      title={
        <div>
          <Icon type="folder" />
          {folder.name}
        </div>
      }
      className={className}
    >
      {fileItems}
      {folder.folders.map((f: IFolder<T>) => {
        return buildFolderMenu(`${parentPath}/${folder.name}`, f, buildFileMenu, className);
      })}
    </SubMenu>
  );
}

//
// export const buildMenu = (directory: IDirectoryStructure<T> )
