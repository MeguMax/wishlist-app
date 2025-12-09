export interface UserProfile {
    user_id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    currency: string
    created_at: string
}

export interface Friendship {
    id: string
    user_id: string
    friend_id: string
    circle: 'family' | 'friends' | 'colleagues'
    status: 'pending' | 'accepted'
    created_at: string
}

export interface Collection {
    id: string
    user_id: string
    name: string
    emoji: string
    event_date: string | null
    created_at: string
}

export interface WishlistItem {
    id: string
    user_id: string
    collection_id: string | null
    title: string
    description: string | null
    link: string | null
    image_url: string | null
    priority: 'low' | 'medium' | 'high'
    estimated_price: number | null
    visibility: 'public' | 'friends' | 'private'
    reserved_count: number
    contributed_amount: number
    created_at: string
}

export interface GiftReservation {
    id: string
    item_id: string
    reserved_by: string
    is_purchased: boolean
    comment: string | null
    created_at: string
}

export interface WishlistComment {
    id: string
    item_id: string
    user_id: string
    comment: string
    created_at: string
}

export interface GroupContribution {
    id: string
    item_id: string
    user_id: string
    amount: number
    created_at: string
}

export interface Notification {
    id: string
    user_id: string
    type: 'friend_request' | 'comment' | 'contribution' | 'reservation'
    title: string
    message: string
    link: string | null
    is_read: boolean
    created_at: string
}

export interface Group {
    id: string
    name: string
    description: string | null
    creator_id: string
    created_at: string
}

export interface GroupMember {
    id: string
    group_id: string
    user_id: string
    role: 'admin' | 'member'
    joined_at: string
}

export interface GiftReservation {
    id: string
    item_id: string
    reserved_by: string
    reserved_at: string
    note: string | null
    status: 'active' | 'cancelled' | 'completed'
}

export interface ItemComment {
    id: string
    item_id: string
    user_id: string
    comment: string
    created_at: string
}

export interface GiftContribution {
    id: string
    item_id: string
    user_id: string
    amount: number
    note: string | null
    created_at: string
}

export interface GroupMessage {
    id: string
    group_id: string
    user_id: string
    message: string
    created_at: string
}
