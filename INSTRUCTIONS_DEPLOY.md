# WhatsHappen - Instructions de Déploiement

Voici les instructions simples pour mettre en ligne votre application WhatsHappen (Version Netlify + Google Drive Backend).

## Partie 1 : Backend (Google Apps Script)

Vous avez déjà le script, mais voici ce que vous devez vous assurer d'avoir dans votre projet Apps Script actuel :

1. Ouvrez votre projet Apps Script : [Lien vers votre projet](https://script.google.com/macros/s/AKfycbxzFevbQJzerwD2L-uNcVTRJE9XVJ4HGdC9KUftOyIKT9pqErsvNfPsfSC12MjBEUDQvA/exec) (Ouvrez l'éditeur).
2. Copiez le contenu du fichier `Code.js` fourni ici et collez-le dans votre fichier `Code.gs` sur Apps Script.
   - **Important :** Ce code contient déjà la configuration correcte pour votre dossier Drive `1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr`.
3. Cliquez sur **Déployer** > **Nouveau déploiement**.
   - Type : **Application Web**.
   - Exécuter en tant que : **Moi** (votre email).
   - Qui peut accéder : **Tout le monde** (ou "Anyone").
4. Copiez l'URL de l'application Web (elle devrait finir par `/exec`).
   - *Note :* Si l'URL a changé, vous devez mettre à jour la ligne `API_URL` dans le fichier `netlify/app.js`. Pour l'instant, c'est configuré avec l'URL que vous m'avez donnée.

### Mise en place du "Nettoyage Automatique" (Trigger)
Pour que les messages s'autodétruisent :
1. Dans Apps Script, cliquez sur l'icône **Déclencheurs** (l'horloge à gauche).
2. Cliquez sur **Ajouter un déclencheur**.
3. Choisissez la fonction : `cleanUpExpiredChats`.
4. Sélectionnez la source de l'événement : **Déclenché par le temps**.
5. Type de déclencheur : **Minuteur**.
6. Fréquence : **Toutes les minutes** (ou 5 minutes).
7. Enregistrez.

---

## Partie 2 : Frontend (Netlify)

C'est l'interface visuelle (Glassmorphism / ChaouiEngage).

1. Sur votre ordinateur, localisez le dossier `netlify` qui a été généré (il contient `index.html`, `style.css`, `app.js`, `logo.js`).
2. Allez sur [Netlify Drop](https://app.netlify.com/drop).
3. Glissez-déposez le dossier `netlify` entier dans la zone indiquée.
4. Netlify va vous donner un lien (ex: `https://whatshappen-random.netlify.app`).
5. **C'est fini !** Vous pouvez ouvrir ce lien sur votre téléphone ou PC.

## Configuration Admin

- **Login Admin :**
  - Email : `chaouiengage@gmail.com`
  - Code : `15112000` (d'après le code existant)
- **Login Utilisateur :**
  - Email : (votre email)
  - Code : (choisissez un code à 3 chiffres lors de l'inscription)

Si vous avez besoin de changer le code Admin, modifiez la variable `_SEC_2` dans `Code.js` (c'est du Base64).
