import prisma from '../config/prisma.js';

export const userRepository = {
    // Cari user berdasarkan email
    findByEmail: async (email) => {
        return prisma.users.findUnique({
            where: { email }
        });
    },

    // Cari user berdasarkan username
    findByUsername: async (username) => {
        return prisma.users.findUnique({
            where: { username }
        });
    },

    // Buat user baru
    create: async (userData) => {
        return prisma.users.create({
            data: userData
        });
    },

    // Cari user berdasarkan token verifikasi
    findByVerificationToken: async (token) => {
        return prisma.users.findFirst({
            where: { verification_token: token }
        });
    },

    // Update status user menjadi verified
    markVerified: async (userId) => {
        return prisma.users.update({
            where: { user_id: userId },
            data: {
                is_verified: true,
                verified_at: new Date(),
                verification_token: null // Hapus token setelah dipakai
            }
        });
    }
};