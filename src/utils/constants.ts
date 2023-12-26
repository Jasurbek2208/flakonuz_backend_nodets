import { IDBNames, IContentDBCollections, ICompanyDBCollections, IImagesDBCollections, IAdminsDBCollections } from '../types'

const dbNames: IDBNames = {
  admins: 'adminsDB',
  companyDB: 'companyDB',
  contentDB: 'contentDB',
  images: 'images',
}

const adminsDBCollections: IAdminsDBCollections = {
  admins: 'admins',
}

const companyDBCollections: ICompanyDBCollections = {
  news: 'news',
  settings: 'settings',
}

const contentDBCollections: IContentDBCollections = {
  products: 'products',
  materials: 'categories',
  categories: 'catalogs',
  colors: 'colors',
  manufacturer: 'manufacturer',
}

const imagesDBCollections: IImagesDBCollections = {
  ...contentDBCollections,
  about: 'about',
  partners: 'partners',
  companyNews: 'news',
}

export { dbNames, adminsDBCollections, companyDBCollections, contentDBCollections, imagesDBCollections }