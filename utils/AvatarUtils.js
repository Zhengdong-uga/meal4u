export const AVATARS = [
    { id: 1, name: 'Avatar 1', source: require('../assets/Avatar1.png') },
    { id: 2, name: 'Avatar 2', source: require('../assets/Avatar2.png') },
    { id: 3, name: 'Avatar 3', source: require('../assets/Avatar3.png') },
    { id: 4, name: 'Avatar 4', source: require('../assets/Avatar4.png') },
    { id: 5, name: 'Avatar 5', source: require('../assets/Avatar5.png') },
    { id: 6, name: 'Avatar 6', source: require('../assets/Avatar6.png') },
    { id: 7, name: 'Avatar 7', source: require('../assets/Avatar7.png') },
];

export const getAvatarSource = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar ? avatar.source : AVATARS[0].source;
};
