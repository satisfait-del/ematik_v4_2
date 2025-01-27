/**
 * @typedef {'admin' | 'user'} UserRole
 * @typedef {'recharge' | 'achat'} TransactionType
 * @typedef {'en_cours' | 'reussi' | 'echoue'} TransactionStatus
 * @typedef {'en_cours' | 'traite' | 'non_traite'} OrderStatus
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - UUID
 * @property {string} [full_name]
 * @property {string} [phone_number]
 * @property {string} [image]
 * @property {UserRole} role
 * @property {number} balance
 * @property {string} [last_login]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {TransactionType} type
 * @property {number} amount
 * @property {TransactionStatus} status
 * @property {string} [description]
 * @property {string} [order_id] - UUID
 * @property {string} [transaction_id_user]
 * @property {number} [balance_after]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Order
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {OrderStatus} status
 * @property {number} total_amount
 * @property {string} transaction_id - UUID
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id - UUID
 * @property {string} order_id - UUID
 * @property {string} service_id - UUID
 * @property {number} quantity
 * @property {number} price_at_time
 * @property {string} created_at
 */
