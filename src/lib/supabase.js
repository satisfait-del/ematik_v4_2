import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'ematik-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const signIn = async ({ email, password }) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// Profile helpers
export const getProfile = async (userId) => {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Services helpers
export const getServices = async (categoryId = null) => {
  let query = supabase.from('services').select('*, categories(*)')
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  const { data, error } = await query
  return { data, error }
}

// Orders helpers
export const createOrder = async (userId, orderItems, totalAmount) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      { user_id: userId, total_amount: totalAmount }
    ])
    .select()
    .single()

  if (orderError) return { error: orderError }

  const orderItemsWithOrderId = orderItems.map(item => ({
    order_id: order.id,
    service_id: item.service_id,
    quantity: item.quantity,
    price_at_time: item.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithOrderId)

  return { data: order, error: itemsError }
}

// Favorites helpers
export const toggleFavorite = async (userId, serviceId) => {
  const { data: existing } = await supabase
    .from('favorites')
    .select()
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    return { data: null, error }
  } else {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, service_id: serviceId }])
    return { data, error }
  }
}

// Reviews helpers
export const addReview = async (userId, serviceId, rating, comment) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      user_id: userId,
      service_id: serviceId,
      rating,
      comment
    }])
  return { data, error }
}

// Categories helpers
export const getCategories = async (parentId = null) => {
  let query = supabase.from('categories').select('*')
  if (parentId === null) {
    query = query.is('parent_id', null)
  } else {
    query = query.eq('parent_id', parentId)
  }
  const { data, error } = await query
  return { data, error }
}
