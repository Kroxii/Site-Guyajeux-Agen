// Script d'initialisation MongoDB pour Docker
db = db.getSiblingDB('guyajeux-agen');
// Créer un utilisateur pour l'application
db.createUser({
  user: 'guyajeux-user',
  pwd: 'guyajeux-password',
  roles: [
    {
      role: 'readWrite',
      db: 'guyajeux-agen'
    }
  ]
});
// Créer les collections avec validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Nom requis'
        },
        email: {
          bsonType: 'string',
          pattern: '^.+@.+\..+$',
          description: 'Email valide requis'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Mot de passe de 6 caractères minimum requis'
        },
        isAdmin: {
          bsonType: 'bool',
          description: 'Statut administrateur'
        }
      }
    }
  }
});
db.createCollection('tournaments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'date', 'maxPlayers', 'game', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Nom du tournoi requis'
        },
        date: {
          bsonType: 'date',
          description: 'Date du tournoi requise'
        },
        maxPlayers: {
          bsonType: 'number',
          minimum: 2,
          maximum: 100,
          description: 'Nombre de joueurs entre 2 et 100'
        },
        game: {
          bsonType: 'string',
          description: 'Nom du jeu requis'
        }
      }
    }
  }
});
db.createCollection('registrations');
// Créer les index pour optimiser les performances
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'isAdmin': 1 });
db.tournaments.createIndex({ 'date': 1 });
db.tournaments.createIndex({ 'game': 1 });
db.tournaments.createIndex({ 'createdBy': 1 });
db.registrations.createIndex({ 'user': 1, 'tournament': 1 }, { unique: true });
db.registrations.createIndex({ 'tournament': 1 });
print('Base de données guyajeux-agen initialisée avec succès');

