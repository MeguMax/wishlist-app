import { supabase } from './supabase'

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type,
            })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
        return data.publicUrl
    } catch (error) {
        console.error('Error uploading avatar:', error)
        return null
    }
}

export async function uploadWishlistImage(userId: string, file: File): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('wishlist-images')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type,
            })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('wishlist-images').getPublicUrl(fileName)
        return data.publicUrl
    } catch (error) {
        console.error('Error uploading wishlist image:', error)
        return null
    }
}
