const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file at root level
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('⚠️  Arquivo .env não encontrado na raiz. Usando variáveis de ambiente do sistema.');
} else {
    console.log('✅  Configurações carregadas do .env');
}

// Variables to inject
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const apiUrlDev = process.env.API_URL_DEV || 'http://localhost:8080/api/v1';
const apiUrlProd = process.env.API_URL_PROD || 'https://api-regua-maxima.a.run.app/api/v1';

// Validation
if (!googleMapsApiKey) {
    console.error('❌  GOOGLE_MAPS_API_KEY não encontrada nas variáveis de ambiente!');
} else {
    console.log('🔑  Google Maps API Key injetada.');
}

// Target files
const targetPath = path.resolve(__dirname, '../src/environments/environment.ts');
const targetPathProd = path.resolve(__dirname, '../src/environments/environment.prod.ts');

// Environment Content Generation
const envConfigFile = `export const environment = {
    production: false,
    apiUrl: '${apiUrlDev}',
    googleMapsApiKey: '${googleMapsApiKey}',
    googleClientId: '${googleClientId}'
};
`;

const envConfigFileProd = `export const environment = {
    production: true,
    apiUrl: '${apiUrlProd}',
    googleMapsApiKey: '${googleMapsApiKey}',
    googleClientId: '${googleClientId}'
};
`;

// Write Files
fs.writeFile(targetPath, envConfigFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log(`🚀  Arquivo gerado em: ${targetPath}`);
});

fs.writeFile(targetPathProd, envConfigFileProd, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log(`🚀  Arquivo gerado em: ${targetPathProd}`);
});
