export interface FeaturedVideo {
  id: string;
  name: string;
  brand: string;
  path: string;
  thumbnail?: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  videos: FeaturedVideo[];
}

export const videoCategories: VideoCategory[] = [
  {
    id: 'credmex',
    name: 'CredMex',
    videos: [
      { id: 'credmex-1', name: '素材 1', brand: 'CredMex', path: '/videos/competitor/CredMex/AQO5lrMi_3448_l1j7Ht9IsS-6osYvEliWToTXEeA_C3lWbNLLjuxyLRt4ypb9Q37iwBXRck6i8pEb63qyezmhO6gLCY-npkej4fb9ge2w.mp4' },
      { id: 'credmex-2', name: '素材 2', brand: 'CredMex', path: '/videos/competitor/CredMex/AQMlKj787SaRz-7ZzPBrfBgkGReKhwlLNkJkkAmzg2a-0OFdP0-zjT-nXX8WUTEjZxRtWwSddv9Nbf7hWhM0TuoOfE2L87UxoI0OsbGFuQ.mp4' },
      { id: 'credmex-3', name: '素材 3', brand: 'CredMex', path: '/videos/competitor/CredMex/AQOuxKAGQ-tBrEloBSCO6FTNl3LHvQ1y4TPAucsXBewAbc3hc1w_0qkNmb1x-fAFIyhn0-LatyYVt9bDURNrTIsYtMgTxzsGVmSr2Qdm0Q.mp4' },
      { id: 'credmex-4', name: '素材 4', brand: 'CredMex', path: '/videos/competitor/CredMex/AQOkqcEcew1ljuPHaZbS7jvq8_vJpBIrhLV9FEowVR5yLGO3BHhw3xuqJq3yOQ8YWcmPWC0h9OFxYM1tGUgSYPDQ.mp4' },
      { id: 'credmex-5', name: '素材 5', brand: 'CredMex', path: '/videos/competitor/CredMex/AQPsHd8FDjsD5odOK3UB6-RrqNMevbgp2h2JzSndPDmN_vLIuInqRq6isuyJffLAQRD5uksAGR-lkLBw8nbHlNAHqapy2C8oQDlzo_tSFg.mp4' },
    ]
  },
  {
    id: 'didi',
    name: 'DiDi Préstamos',
    videos: [
      { id: 'didi-1', name: '素材 1', brand: 'DiDi', path: '/videos/competitor/DiDi Préstamos/AQN1u8JA10ieUWXiQiZGngYSkU-aamt41Ivha_RyoADP6U4eHTLQEqUp00yLKUheuWVQNIrelPTxsakk7eZaxln5DnBPeXgi7aEdtJvy4Q.mp4' },
      { id: 'didi-2', name: '素材 2', brand: 'DiDi', path: '/videos/competitor/DiDi Préstamos/AQMHAZ6SNa3rBLNQ36YlEv4ciF9aSVeiODIkZk_IyQNBxIaFdfcxK-CRxOoJurfBTT2jwzP81QXu-doTjATHAWIp8nmIGjXDyiJs7lu8aA.mp4' },
      { id: 'didi-3', name: '素材 3', brand: 'DiDi', path: '/videos/competitor/DiDi Préstamos/AQPjhquGhM7xUYHqVvNPk8FEZGMpFzn7pgBsPYMwoQKkcVUEYPNER6In5tXEqSCRX36rMfg397AKMIl1oIsT5fFjAi_sJhZaPfr5-yBUlg.mp4' },
      { id: 'didi-4', name: '素材 4', brand: 'DiDi', path: '/videos/competitor/DiDi Préstamos/AQNDI0jbdjNQEB4Ze-Lr6ze1qKbTzsev7MjZwyIKYBixHkp2cnmyXGYK1iRAgXOiOjkxpVveEaSFQUaOlCk0ZooUHxlII6hForGLc8Czdg.mp4' },
      { id: 'didi-5', name: '素材 5', brand: 'DiDi', path: '/videos/competitor/DiDi Préstamos/AQOXQA2vo29pSBd69eyfQudkurx74CxcjnTqiaqp4_BdsZnt1C2tQvIgjJAltmg-kJ9R8eC2sFhtZ-MsS-wIuiIEn1aC5bf2UsmsfS67yw.mp4' },
    ]
  },
  {
    id: 'tala',
    name: 'Tala',
    videos: [
      { id: 'tala-1', name: '素材 1', brand: 'Tala', path: '/videos/competitor/tala/AQPUNGtuaHrEnBxqNEimk7Iix2ulG94LK7tH5kirFgVZvTm0m3NScfGk6wH9uC7knl9ipXHxav5gVXH7agXrfOVspiGSYuZB2l6SvgeIbw.mp4' },
      { id: 'tala-2', name: '素材 2', brand: 'Tala', path: '/videos/competitor/tala/AQM2zRtc_DzfNmvW9Wol16Oo1YFR1euwiWOB9qqbACm1qlrDKxFcAGOUEpsjuuDGoePvhzwzzHHmBfgZjE4g7kmLQv13EJ7M-Ptp2HWokg.mp4' },
      { id: 'tala-3', name: '素材 3', brand: 'Tala', path: '/videos/competitor/tala/AQN1Cn98ZHQHJ4bbDfROEhaVllK4UOiTz7V0ZqA5kDqmb28fl_Sbe6rPuUhXmmoOQJe276lLMwHyt7VHohOpkzGzRrWDxUZYj3qf3En-Ig.mp4' },
      { id: 'tala-4', name: '素材 4', brand: 'Tala', path: '/videos/competitor/tala/AQOvPBUWDwJhoxPagJFnXT-BvBuA0mpHYoo12ObKCOZep_MItWSBFtqBEwg5NxRwHb8xHcJZ7V-Be0B905brBZg1lVHYE8KBFjLRd2zwrQ.mp4' },
      { id: 'tala-5', name: '素材 5', brand: 'Tala', path: '/videos/competitor/tala/AQMi451eL7sthFfp7xIPkabmvoCBEMFjLTbN6Yo0k1w00HN1ENfL1Anp2pEoAggwiZ6HzIro3z60SKbmpvt_XyEQEcHZg6U1kgOcpr_AUA.mp4' },
    ]
  },
  {
    id: 'fortaprest',
    name: 'Fortaprest',
    videos: [
      { id: 'fortaprest-1', name: '素材 1', brand: 'Fortaprest', path: '/videos/competitor/Fortaprest/AQOIqVEuCk4ebFvqyJKGJD11r3hxnYnO-BOKYs8aWoZhdQLZJ-SVMTBjBL6VYcabO571Pzd2QhcPyFflEdYPvTt48lZ1iM0fFLvKhtmKHw.mp4' },
      { id: 'fortaprest-2', name: '素材 2', brand: 'Fortaprest', path: '/videos/competitor/Fortaprest/AQNG45ikwLoHRle5IUMxrdFTLVPWTqzFv1aKO3B-x2y6J3nh325ZCyrMn1JkqVuybvdjE9fzjpXQljrITeQ4cSwJ16RqoOTWgfGiC353Uw.mp4' },
      { id: 'fortaprest-3', name: '素材 3', brand: 'Fortaprest', path: '/videos/competitor/Fortaprest/AQMWUYGcNFbLMLCMT5E088JtKfYdW2iQzUWfvC75xJmO0ohSxT_rZDXUjcqVtUmLHFoIVks1cQ5zKLoUgKb5OeUnuRvcjJx_d8WD7w5e4g.mp4' },
      { id: 'fortaprest-4', name: '素材 4', brand: 'Fortaprest', path: '/videos/competitor/Fortaprest/AQPSfkIg9qNgcwF5o9Jm7cSN6-tvvjo4FCFN41t5IkkWTgPcUsL-MchPM7ayhVup3yw4wp0Aj1mNvxRsvZmTQ7963JzJBKoVNA9ullFcug.mp4' },
      { id: 'fortaprest-5', name: '素材 5', brand: 'Fortaprest', path: '/videos/competitor/Fortaprest/AQMpYRXm2FaDc46hdsX3VefnhHHXQMVSFYxdKknVWPFb38XYGLhbUB0qCJRRH7EC6RHmQ8KrUdA3gm_626ev4ASI1ElVgxTdPIuQNQBTjA.mp4' },
    ]
  },
  {
    id: 'mexicash',
    name: 'MexiCash',
    videos: [
      { id: 'mexicash-1', name: '素材 1', brand: 'MexiCash', path: '/videos/competitor/MexiCash/AQOZKCUc_S5nXgIlZCFKSHDZR3kKb3VLqGX2WLtjZ5_XQOmPLgKwJMsKE-wSLlVHRJPiXJGQkLzXSvqV.mp4' },
    ]
  }
];

// 获取所有视频的扁平列表
export const getAllVideos = (): FeaturedVideo[] => {
  return videoCategories.flatMap(category => category.videos);
};
