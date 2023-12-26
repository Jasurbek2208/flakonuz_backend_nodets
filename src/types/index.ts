export interface IDBNames {
  admins: 'adminsDB'
  companyDB: 'companyDB'
  contentDB: 'contentDB'
  images: 'images'
}

export interface IAdminsDBCollections {
  admins: 'admins'
}

export interface ICompanyDBCollections {
  news: 'news'
  settings: 'settings'
}

export interface IContentDBCollections {
  products: 'products'
  materials: 'categories'
  categories: 'catalogs'
  colors: 'colors'
  manufacturer: 'manufacturer'
}

export interface IImagesDBCollections extends IContentDBCollections {
  about: 'about'
  partners: 'partners'
  companyNews: 'news'
}

type ImageContentType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp' | 'image/svg'

export interface IImage {
  contentType: ImageContentType
  data: string
  id: string
  _id: string
}

export interface ICategory {
  id: string
  title_ru: string
  title_uz: string
  title_en: string
  image: string
}
export interface ICategoryData extends ICategory {
  categories: string[]
  aboutCategory_en: string
  aboutCategory_ru: string
  aboutCategory_uz: string
}
export interface IProduct {
  _id: string
  id: string
  title: string
  height: number
  width: number
  diameter: number
  ml: number
  material: string
  category: string
  image: string
}
export interface IProductData extends Omit<IProduct, 'image'> {
  image: IImage
}
export interface IUser {
  _id: string
  id: string
  name: string
  image: string
  surname: string
  username: string
  password: string
  access_token: string
}
export interface IMaterial {
  _id: string
  id: string
  title: string
}
export interface IColor {
  _id: string
  id: string
  title_en: string
  title_ru: string
  title_uz: string
}
export interface IManufacturer {
  _id: string
  id: string
  title_en: string
  title_ru: string
  title_uz: string
}

export interface ISettings {
  addressName: { en: string; ru: string; uz: string }
  id: string
  gmail: { en: string; ru: string }
  phone: string[]
  telegram: string
  instagram: string
  website: string
  videoLink: string
  catalogPDF: any
}

export interface ICompanyNews {
  _id: string
  id: string
  title_en: string
  title_ru: string
  title_uz: string
  description_en: string
  description_ru: string
  description_uz: string
  published_date: string
  image: string
}
export interface ICompanyNewsData extends Omit<ICompanyNews, 'image'> {
  image: IImage
}