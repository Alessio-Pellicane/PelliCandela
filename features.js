// Base de données en mémoire (simulation)
let clients = [
    { id: 1, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@email.com', telephone: '0123456789', adresse: '123 Rue de la Paix, Paris' },
    { id: 2, nom: 'Martin', prenom: 'Marie', email: 'marie.martin@email.com', telephone: '0234567890', adresse: '456 Avenue des Champs, Lyon' }
];

let produits = [
    { id: 1, nom: 'Ordinateur Portable', description: 'PC portable 15 pouces, 8GB RAM', prix: 899.99, stock: 1 },
    { id: 2, nom: 'Souris sans fil', description: 'Souris ergonomique Bluetooth', prix: 29.99, stock: 50 },
    { id: 3, nom: 'Clavier mécanique', description: 'Clavier gaming RGB', prix: 129.99, stock: 0 }
];

let commandes = [];
let factures = [];
let currentEditId = null;
let produitsCommande = [];
let factureCounter = 1000;

// Navigation entre sections
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(sectionName).classList.add('active');
    event.target.classList.add('active');

    // Rafraîchir la liste correspondante
    switch (sectionName) {
        case 'clients': rafraichirListeClients(); break;
        case 'produits': rafraichirListeProduits(); break;
        case 'commandes': rafraichirListeCommandes(); break;
        case 'factures': rafraichirListeFactures(); break;
    }
}

// Gestion des modals
function ouvrirModalClient(id = null) {
    currentEditId = id;
    const modal = document.getElementById('modalClient');
    const title = document.getElementById('modalClientTitle');

    if (id) {
        title.textContent = 'Modifier Client';
        const client = clients.find(c => c.id === id);
        if (client) {
            document.getElementById('clientNom').value = client.nom;
            document.getElementById('clientPrenom').value = client.prenom;
            document.getElementById('clientEmail').value = client.email;
            document.getElementById('clientTelephone').value = client.telephone || '';
            document.getElementById('clientAdresse').value = client.adresse || '';
        }
    } else {
        title.textContent = 'Nouveau Client';
        document.getElementById('clientForm').reset();
    }

    modal.style.display = 'block';
}

function ouvrirModalProduit(id = null) {
    currentEditId = id;
    const modal = document.getElementById('modalProduit');
    const title = document.getElementById('modalProduitTitle');

    if (id) {
        title.textContent = 'Modifier Produit';
        const produit = produits.find(p => p.id === id);
        if (produit) {
            document.getElementById('produitNom').value = produit.nom;
            document.getElementById('produitDescription').value = produit.description || '';
            document.getElementById('produitPrix').value = produit.prix;
            document.getElementById('produitStock').value = produit.stock;
        }
    } else {
        title.textContent = 'Nouveau Produit';
        document.getElementById('produitForm').reset();
    }

    modal.style.display = 'block';
}

function ouvrirModalCommande(id = null) {
    currentEditId = id;
    const title = document.getElementById('modalCommandeTitle');

    // Mettre à jour la liste des clients
    const selectClient = document.getElementById('commandeClient');
    selectClient.innerHTML = '<option value="">Sélectionnez un client</option>';
    clients.forEach(client => {
        selectClient.innerHTML += `<option value="${client.id}">${client.prenom} ${client.nom}</option>`;
    });

    // Mettre à jour la liste des produits
    const selectProduit = document.getElementById('selectProduit');
    selectProduit.innerHTML = '<option value="">Sélectionnez un produit</option>';
    produits.forEach(produit => {
        if (produit.stock > 0) {
            selectProduit.innerHTML += `<option value="${produit.id}" data-prix="${produit.prix}" data-stock="${produit.stock}">${produit.nom} - ${produit.prix}€ (Stock: ${produit.stock})</option>`;
        }
    });

    if (id) {
        // Mode modification
        title.textContent = 'Modifier Commande';
        const commande = commandes.find(c => c.id === id);
        if (commande) {
            document.getElementById('commandeClient').value = commande.clientId;
            produitsCommande = [...commande.produits];
            rafraichirProduitsCommande();
        }
    } else {
        // Mode création
        title.textContent = 'Nouvelle Commande';
        produitsCommande = [];
        document.getElementById('commandeClient').selectedIndex = 0;
        document.getElementById('selectProduit').selectedIndex = 0;
        document.getElementById('quantiteProduit').value = 1;
        rafraichirProduitsCommande();
    }

    document.getElementById('modalCommande').style.display = 'block';
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditId = null;
}

// Gestion des clients
document.getElementById('clientForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const clientData = {
        nom: formData.get('nom'),
        prenom: formData.get('prenom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        adresse: formData.get('adresse')
    };

    if (currentEditId) {
        // Modification
        const index = clients.findIndex(c => c.id === currentEditId);
        if (index !== -1) {
            clients[index] = { ...clientData, id: currentEditId };
        }
    } else {
        // Ajout
        const newId = Math.max(...clients.map(c => c.id), 0) + 1;
        clients.push({ ...clientData, id: newId });
    }

    rafraichirListeClients();
    fermerModal('modalClient');
});

// Gestion des produits
document.getElementById('produitForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const produitData = {
        nom: formData.get('nom'),
        description: formData.get('description'),
        prix: parseFloat(formData.get('prix')),
        stock: parseInt(formData.get('stock'))
    };

    if (currentEditId) {
        // Modification
        const index = produits.findIndex(p => p.id === currentEditId);
        if (index !== -1) {
            produits[index] = { ...produitData, id: currentEditId };
        }
    } else {
        // Ajout
        const newId = Math.max(...produits.map(p => p.id), 0) + 1;
        produits.push({ ...produitData, id: newId });
    }

    rafraichirListeProduits();
    fermerModal('modalProduit');
});

// Gestion des commandes
function ajouterProduitCommande() {
    const selectProduit = document.getElementById('selectProduit');
    const quantite = parseInt(document.getElementById('quantiteProduit').value);

    if (!selectProduit.value || quantite <= 0) {
        alert('Veuillez sélectionner un produit et une quantité valide');
        return;
    }

    const produitId = parseInt(selectProduit.value);
    const produit = produits.find(p => p.id === produitId);
    const prix = parseFloat(selectProduit.options[selectProduit.selectedIndex].dataset.prix);
    const stockDisponible = parseInt(selectProduit.options[selectProduit.selectedIndex].dataset.stock);

    // Vérifier le stock
    const quantiteDejaCommande = produitsCommande.find(p => p.produitId === produitId)?.quantite || 0;
    if (quantiteDejaCommande + quantite > stockDisponible) {
        alert(`Stock insuffisant! Stock disponible: ${stockDisponible - quantiteDejaCommande}`);
        return;
    }

    // Vérifier si le produit est déjà dans la commande
    const existingIndex = produitsCommande.findIndex(p => p.produitId === produitId);
    if (existingIndex >= 0) {
        produitsCommande[existingIndex].quantite += quantite;
    } else {
        produitsCommande.push({
            produitId: produitId,
            nom: produit.nom,
            prix: prix,
            quantite: quantite
        });
    }

    rafraichirProduitsCommande();

    // Réinitialiser les champs
    selectProduit.selectedIndex = 0;
    document.getElementById('quantiteProduit').value = 1;
}

function rafraichirProduitsCommande() {
    const liste = document.getElementById('produitsCommandeList');
    
    if (produitsCommande.length === 0) {
        liste.innerHTML = '<p style="text-align: center; color: #666;">Aucun produit ajouté</p>';
        document.getElementById('totalCommande').textContent = '0.00€';
        return;
    }

    liste.innerHTML = '';
    let total = 0;

    produitsCommande.forEach((item, index) => {
        const sousTotal = item.prix * item.quantite;
        total += sousTotal;

        liste.innerHTML += `
            <div class="produit-item">
                <div class="produit-info">
                    <strong>${item.nom}</strong><br>
                    ${item.quantite} × ${item.prix.toFixed(2)}€ = <strong>${sousTotal.toFixed(2)}€</strong>
                </div>
                <div>
                    <button class="btn btn-warning" type="button" onclick="modifierQuantiteProduitCommande(${index})">✏️</button>
                    <button class="btn btn-danger" type="button" onclick="supprimerProduitCommande(${index})">🗑️</button>
                </div>
            </div>
        `;
    });

    document.getElementById('totalCommande').textContent = total.toFixed(2) + '€';
}

function supprimerProduitCommande(index) {
    produitsCommande.splice(index, 1);
    rafraichirProduitsCommande();
}

function modifierQuantiteProduitCommande(index) {
    const item = produitsCommande[index];
    const nouvelleQuantite = prompt(`Nouvelle quantité pour ${item.nom}:`, item.quantite);
    
    if (nouvelleQuantite && !isNaN(nouvelleQuantite) && nouvelleQuantite > 0) {
        const produit = produits.find(p => p.id === item.produitId);
        if (nouvelleQuantite <= produit.stock) {
            produitsCommande[index].quantite = parseInt(nouvelleQuantite);
            rafraichirProduitsCommande();
        } else {
            alert(`Stock insuffisant! Stock disponible: ${produit.stock}`);
        }
    }
}

document.getElementById('commandeForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const clientId = parseInt(document.getElementById('commandeClient').value);

    if (!clientId || produitsCommande.length === 0) {
        alert('Veuillez sélectionner un client et ajouter au moins un produit');
        return;
    }

    const total = produitsCommande.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

    if (currentEditId) {
        // Modification d'une commande existante
        const index = commandes.findIndex(c => c.id === currentEditId);
        if (index !== -1) {
            // Remettre le stock des anciens produits
            const ancienneCommande = commandes[index];
            ancienneCommande.produits.forEach(item => {
                const produitIndex = produits.findIndex(p => p.id === item.produitId);
                if (produitIndex !== -1) {
                    produits[produitIndex].stock += item.quantite;
                }
            });

            // Mettre à jour la commande
            commandes[index] = {
                id: currentEditId,
                clientId: clientId,
                date: commandes[index].date, // Garder la date originale
                total: total,
                produits: [...produitsCommande]
            };

            // Mettre à jour la facture associée
            const factureIndex = factures.findIndex(f => f.commandeId === currentEditId);
            if (factureIndex !== -1) {
                const client = clients.find(c => c.id === clientId);
                factures[factureIndex] = {
                    ...factures[factureIndex],
                    clientNom: `${client.prenom} ${client.nom}`,
                    montantTotal: total,
                    produits: [...produitsCommande]
                };
            }
        }
    } else {
        // Nouvelle commande
        const commandeId = Math.max(...commandes.map(c => c.id), 0) + 1;
        const client = clients.find(c => c.id === clientId);

        // Créer la commande
        const commande = {
            id: commandeId,
            clientId: clientId,
            date: new Date().toLocaleDateString('fr-FR'),
            total: total,
            produits: [...produitsCommande]
        };

        commandes.push(commande);

        // Créer la facture automatiquement
        factureCounter++;
        const facture = {
            id: factureCounter,
            commandeId: commandeId,
            numeroFacture: `F${factureCounter}`,
            dateFacture: new Date().toLocaleDateString('fr-FR'),
            clientNom: `${client.prenom} ${client.nom}`,
            clientAdresse: client.adresse || '',
            clientEmail: client.email,
            clientTelephone: client.telephone || '',
            montantTotal: total,
            produits: [...produitsCommande]
        };

        factures.push(facture);

        // Afficher la facture
        afficherFacture(facture);
    }

    // Décrémenter le stock
    produitsCommande.forEach(item => {
        const produitIndex = produits.findIndex(p => p.id === item.produitId);
        if (produitIndex !== -1) {
            produits[produitIndex].stock -= item.quantite;
        }
    });

    rafraichirListeCommandes();
    rafraichirListeFactures();
    rafraichirListeProduits();
    fermerModal('modalCommande');
});

// Fonctions d'affichage des listes
function rafraichirListeClients() {
    const tbody = document.getElementById('clients-list');
    tbody.innerHTML = '';

    clients.forEach(client => {
        tbody.innerHTML += `
            <tr>
                <td>${client.id}</td>
                <td>${client.nom}</td>
                <td>${client.prenom}</td>
                <td>${client.email}</td>
                <td>${client.telephone || '-'}</td>
                <td class="actions">
                    <button class="btn" onclick="ouvrirModalClient(${client.id})">✏️</button>
                    <button class="btn btn-danger" onclick="supprimerClient(${client.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function rafraichirListeProduits() {
    const tbody = document.getElementById('produits-list');
    tbody.innerHTML = '';

    produits.forEach(produit => {
        let statut = '✅ En stock';
        let statutClass = '';

        if (produit.stock === 0) {
            statut = '❌ Rupture';
            statutClass = 'style="color: #e53e3e; font-weight: bold;"';
        } else if (produit.stock < 10) {
            statut = '⚠️ Stock faible';
            statutClass = 'style="color: #d69e2e; font-weight: bold;"';
        }

        tbody.innerHTML += `
            <tr>
                <td>${produit.id}</td>
                <td>${produit.nom}</td>
                <td>${produit.prix.toFixed(2)}€</td>
                <td>${produit.stock}</td>
                <td ${statutClass}>${statut}</td>
                <td class="actions">
                    <button class="btn" onclick="ouvrirModalProduit(${produit.id})">✏️</button>
                    <button class="btn btn-danger" onclick="supprimerProduit(${produit.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function rafraichirListeCommandes() {
    const tbody = document.getElementById('commandes-list');
    tbody.innerHTML = '';

    commandes.forEach(commande => {
        const client = clients.find(c => c.id === commande.clientId);
        const clientNom = client ? `${client.prenom} ${client.nom}` : 'Client supprimé';

        tbody.innerHTML += `
            <tr>
                <td>${commande.id}</td>
                <td>${clientNom}</td>
                <td>${commande.date}</td>
                <td>${commande.total.toFixed(2)}€</td>
                <td class="actions">
                    <button class="btn" onclick="voirDetailsCommande(${commande.id})">👁️</button>
                    <button class="btn btn-warning" onclick="ouvrirModalCommande(${commande.id})">✏️</button>
                    <button class="btn btn-danger" onclick="supprimerCommande(${commande.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function rafraichirListeFactures() {
    const tbody = document.getElementById('factures-list');
    tbody.innerHTML = '';

    factures.forEach(facture => {
        tbody.innerHTML += `
            <tr>
                <td>${facture.numeroFacture}</td>
                <td>${facture.clientNom}</td>
                <td>${facture.dateFacture}</td>
                <td>${facture.montantTotal.toFixed(2)}€</td>
                <td class="actions">
                    <button class="btn" onclick="afficherFacture(${JSON.stringify(facture).replace(/"/g, '&quot;')})">👁️</button>
                    <button class="btn btn-success" onclick="telechargerFacturePDF(${facture.id})">📥 PDF</button>
                </td>
            </tr>
        `;
    });
}

// Fonctions de suppression
function supprimerClient(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
        clients = clients.filter(c => c.id !== id);
        rafraichirListeClients();
    }
}

function supprimerProduit(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        produits = produits.filter(p => p.id !== id);
        rafraichirListeProduits();
    }
}

function supprimerCommande(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ? La facture associée sera également supprimée.')) {
        // Remettre le stock
        const commande = commandes.find(c => c.id === id);
        if (commande) {
            commande.produits.forEach(item => {
                const produitIndex = produits.findIndex(p => p.id === item.produitId);
                if (produitIndex !== -1) {
                    produits[produitIndex].stock += item.quantite;
                }
            });
        }

        commandes = commandes.filter(c => c.id !== id);
        factures = factures.filter(f => f.commandeId !== id);
        rafraichirListeCommandes();
        rafraichirListeFactures();
        rafraichirListeProduits();
    }
}

// Fonctions de recherche
function rechercherClients(terme) {
    const rows = document.querySelectorAll('#clients-list tr');
    rows.forEach(row => {
        const texte = row.textContent.toLowerCase();
        row.style.display = texte.includes(terme.toLowerCase()) ? '' : 'none';
    });
}

function rechercherProduits(terme) {
    const rows = document.querySelectorAll('#produits-list tr');
    rows.forEach(row => {
        const texte = row.textContent.toLowerCase();
        row.style.display = texte.includes(terme.toLowerCase()) ? '' : 'none';
    });
}

function rechercherCommandes(terme) {
    const rows = document.querySelectorAll('#commandes-list tr');
    rows.forEach(row => {
        const texte = row.textContent.toLowerCase();
        row.style.display = texte.includes(terme.toLowerCase()) ? '' : 'none';
    });
}

function rechercherFactures(terme) {
    const rows = document.querySelectorAll('#factures-list tr');
    rows.forEach(row => {
        const texte = row.textContent.toLowerCase();
        row.style.display = texte.includes(terme.toLowerCase()) ? '' : 'none';
    });
}

// Filtres
function filtrerProduitsParStock(filtre) {
    const rows = document.querySelectorAll('#produits-list tr');
    rows.forEach(row => {
        const stockCell = row.cells[3];
        if (stockCell) {
            const stock = parseInt(stockCell.textContent);
            let afficher = true;

            switch (filtre) {
                case 'low':
                    afficher = stock < 10 && stock > 0;
                    break;
                case 'empty':
                    afficher = stock === 0;
                    break;
                default:
                    afficher = true;
            }

            row.style.display = afficher ? '' : 'none';
        }
    });
}

// Fonctions pour les factures
function voirDetailsCommande(id) {
    const commande = commandes.find(c => c.id === id);
    if (!commande) return;

    const facture = factures.find(f => f.commandeId === id);
    if (facture) {
        afficherFacture(facture);
    }
}

function afficherFacture(facture) {
    const modal = document.getElementById('modalFacture');
    const content = document.getElementById('factureContent');

    let produitsHtml = '';
    facture.produits.forEach(item => {
        produitsHtml += `
            <tr>
                <td>${item.nom}</td>
                <td>${item.quantite}</td>
                <td>${item.prix.toFixed(2)}€</td>
                <td>${(item.prix * item.quantite).toFixed(2)}€</td>
            </tr>
        `;
    });

    content.innerHTML = `
        <div class="facture-header">
            <h1>🧾 FACTURE</h1>
            <h2>PelliCandela</h2>
            <p>Numéro: ${facture.numeroFacture}</p>
            <p>Date: ${facture.dateFacture}</p>
        </div>

        <div class="facture-info">
            <div>
                <h3>Facturé à:</h3>
                <p><strong>${facture.clientNom}</strong></p>
                <p>${facture.clientAdresse}</p>
                <p>📧 ${facture.clientEmail}</p>
                <p>📞 ${facture.clientTelephone}</p>
            </div>
            <div>
                <h3>Vendeur:</h3>
                <p><strong>PelliCandela</strong></p>
                <p>Votre adresse ici</p>
                <p>📧 contact@pellicandela.com</p>
                <p>📞 Votre téléphone</p>
            </div>
        </div>

        <table class="facture-table">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${produitsHtml}
            </tbody>
        </table>

        <div class="facture-total">
            <strong>TOTAL: ${facture.montantTotal.toFixed(2)}€</strong>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Merci pour votre confiance !</p>
        </div>
    `;

    modal.style.display = 'block';
}

function telechargerFacture() {
    alert('Fonctionnalité de téléchargement PDF à implémenter avec une bibliothèque comme jsPDF');
}

function telechargerFacturePDF(factureId) {
    const facture = factures.find(f => f.id === factureId);
    if (facture) {
        afficherFacture(facture);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    rafraichirListeClients();
});

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        currentEditId = null;
    }
});