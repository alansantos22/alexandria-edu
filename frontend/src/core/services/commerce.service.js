import api from '../api.js'

export const commerceService = {
  // Catálogo público
  listCatalog()         { return api.get('/catalog').then(r => r.data) },
  getProduct(slug)      { return api.get(`/catalog/${slug}`).then(r => r.data) },
  getPromo(slug)        { return api.get(`/catalog/promo/${slug}`).then(r => r.data) },

  // Checkout
  quote(payload)        { return api.post('/checkout/quote', payload).then(r => r.data) },
  start(payload)        { return api.post('/checkout/start', payload).then(r => r.data) },

  // Matrículas do aluno
  myEnrollments()       { return api.get('/me/enrollments').then(r => r.data) },

  // Admin – produtos
  adminListProducts()                   { return api.get('/admin/products').then(r => r.data) },
  adminGetProduct(id)                   { return api.get(`/admin/products/${id}`).then(r => r.data) },
  adminCreateProduct(body)              { return api.post('/admin/products', body).then(r => r.data) },
  adminUpdateProduct(id, body)          { return api.patch(`/admin/products/${id}`, body).then(r => r.data) },
  adminDeleteProduct(id)                { return api.delete(`/admin/products/${id}`).then(r => r.data) },
  adminAttachCourse(id, courseId)       { return api.post(`/admin/products/${id}/courses`, { courseId }).then(r => r.data) },
  adminDetachCourse(id, courseId)       { return api.delete(`/admin/products/${id}/courses/${courseId}`).then(r => r.data) },

  // Admin – campanhas
  adminListCampaigns()                  { return api.get('/admin/campaigns').then(r => r.data) },
  adminCreateCampaign(body)             { return api.post('/admin/campaigns', body).then(r => r.data) },
  adminUpdateCampaign(id, body)         { return api.patch(`/admin/campaigns/${id}`, body).then(r => r.data) },
  adminDeleteCampaign(id)               { return api.delete(`/admin/campaigns/${id}`).then(r => r.data) },
  adminAttachProductToCampaign(id, productId)   { return api.post(`/admin/campaigns/${id}/products`, { productId }).then(r => r.data) },
  adminDetachProductFromCampaign(id, productId) { return api.delete(`/admin/campaigns/${id}/products/${productId}`).then(r => r.data) },

  // Admin – turmas (cohorts)
  adminListCohorts(productId)           { return api.get(`/admin/cohorts`, { params: { productId } }).then(r => r.data) },
  adminCreateCohort(body)               { return api.post('/admin/cohorts', body).then(r => r.data) },
  adminUpdateCohort(id, body)           { return api.patch(`/admin/cohorts/${id}`, body).then(r => r.data) },
  adminDeleteCohort(id)                 { return api.delete(`/admin/cohorts/${id}`).then(r => r.data) },

  // Público – turmas (para escolher na compra)
  listCohorts(productId)                { return api.get(`/cohorts`, { params: { productId } }).then(r => r.data) },
}
