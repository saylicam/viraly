import { useCreatorProfile } from '../services/creatorProfile';

/**
 * Profil du créateur (niveau, niches, objectif, prénom…).
 *
 * @returns { hasCompleteProfile, loading, profileData }
 */
export const useUserProfile = () => {
  const { profile, loading } = useCreatorProfile();
  return {
    hasCompleteProfile: !!profile?.level,
    loading,
    profileData: { ...(profile ?? {}) } as any,
  };
};
