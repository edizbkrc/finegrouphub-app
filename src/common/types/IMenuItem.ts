export interface IMenuGroup {
  name: string;
  id: number;
  order: number;
}

export interface IMenuItem {
  name: string;
  url: string | null;
  pageName: string | null;
  parentId: number | null;
  group: IMenuGroup;
  childrens: IMenuItem[] | null;
  id: number;
  isTeam?: boolean;
  icon?: any;
  order: number;
}
