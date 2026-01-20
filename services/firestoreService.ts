import { db } from '../firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    setDoc,
    query,
    where,
    orderBy,
    DocumentData,
    writeBatch
} from 'firebase/firestore';

// Helper para converter dados do Firestore
export const convertFirestoreData = (docData: DocumentData, docId: string) => {
    return {
        ...docData,
        id: docId
    };
};

// Coleção: collection
export const getCollection = async (userId: string) => {
    const q = query(
        collection(db, 'collection'),
        where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id // ID do documento Firestore
    }));

    // Ordenar no cliente
    return items.sort((a: any, b: any) => {
        const titleCompare = a.title.localeCompare(b.title);
        if (titleCompare !== 0) return titleCompare;
        return a.volume.localeCompare(b.volume, undefined, { numeric: true });
    });
};

export const addToCollection = async (userId: string, items: any[]) => {
    const batch = writeBatch(db);
    const addedItems: any[] = [];

    for (const item of items) {
        const docRef = doc(collection(db, 'collection'));
        batch.set(docRef, {
            ...item,
            user_id: userId
        });
        addedItems.push({
            ...item,
            docId: docRef.id
        });
    }

    await batch.commit();
    return addedItems;
};

export const removeFromCollection = async (userId: string, itemId: string) => {
    // Buscar o documento pelo item_id
    const q = query(
        collection(db, 'collection'),
        where('user_id', '==', userId),
        where('item_id', '==', itemId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
    }
};

// Coleção: series_status
export const getSeriesStatus = async (userId: string) => {
    const q = query(
        collection(db, 'series_status'),
        where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

export const updateSeriesStatus = async (userId: string, mangaId: string, status: string) => {
    const docRef = doc(db, 'series_status', `${userId}_${mangaId}`);
    await setDoc(docRef, {
        user_id: userId,
        manga_id: mangaId,
        status: status
    }, { merge: true });
};

// Coleção: tracked_volumes
export const getTrackedVolumes = async (userId: string) => {
    const q = query(
        collection(db, 'tracked_volumes'),
        where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

export const updateTrackedVolumes = async (userId: string, mangaId: string, volumes: string[]) => {
    const docRef = doc(db, 'tracked_volumes', `${userId}_${mangaId}`);
    await setDoc(docRef, {
        user_id: userId,
        manga_id: mangaId,
        volumes: volumes
    }, { merge: true });
};

// Coleção: hidden_volumes
export const getHiddenVolumes = async (userId: string) => {
    const q = query(
        collection(db, 'hidden_volumes'),
        where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

export const updateHiddenVolumes = async (userId: string, mangaId: string, volumes: string[]) => {
    const docRef = doc(db, 'hidden_volumes', `${userId}_${mangaId}`);
    await setDoc(docRef, {
        user_id: userId,
        manga_id: mangaId,
        volumes: volumes
    }, { merge: true });
};

// Coleção: users
export const getUserData = async (userId: string) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const updateUserData = async (userId: string, data: Partial<{ username: string, themeColor: string, photoURL: string }>) => {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, data, { merge: true });
};

// Função combinada para atualizar tracked e hidden volumes
export const updateMangaVolumeConfigs = async (
    userId: string,
    mangaId: string,
    trackedVolumes: string[],
    hiddenVolumes: string[]
) => {
    await Promise.all([
        updateTrackedVolumes(userId, mangaId, trackedVolumes),
        updateHiddenVolumes(userId, mangaId, hiddenVolumes)
    ]);
};

// Coleção: chapter_progress
export const getChapterProgress = async (userId: string) => {
    const q = query(
        collection(db, 'chapter_progress'),
        where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => doc.data());

    // Ordenar no cliente para evitar necessidade de índice composto no Firestore
    return items.sort((a: any, b: any) => {
        const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt) || 0;
        const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt) || 0;
        return dateB - dateA;
    });
};

export const updateChapterProgress = async (userId: string, mangaId: string, data: any) => {
    const docRef = doc(db, 'chapter_progress', `${userId}_${mangaId}`);
    await setDoc(docRef, {
        ...data,
        user_id: userId,
        manga_id: mangaId,
        updatedAt: new Date()
    }, { merge: true });
};

export const removeChapterProgress = async (userId: string, mangaId: string) => {
    const docRef = doc(db, 'chapter_progress', `${userId}_${mangaId}`);
    await deleteDoc(docRef);
};
