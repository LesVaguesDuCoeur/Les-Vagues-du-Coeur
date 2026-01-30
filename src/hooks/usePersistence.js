import { useState, useEffect } from 'react';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec';

export function usePersistence(initialMenu) {
    const [menu, setMenu] = useState(() => {
        try {
            const saved = localStorage.getItem('gastro-plan');
            return saved ? JSON.parse(saved) : initialMenu;
        } catch (e) {
            return initialMenu;
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        localStorage.setItem('gastro-plan', JSON.stringify(menu));
    }, [menu]);

    const saveToCloud = async () => {
        setIsSaving(true);
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(menu)
            });
            alert('Sauvegarde effectuée (Cloud) !');
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };

    return { menu, setMenu, saveToCloud, isSaving };
}
