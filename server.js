const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { createconst express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_DE_PRUEBA_LOCAL' 
});

// Configuración de Supabase para el backend usando variables de entorno seguras
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://olvieohhsybycmyojdpo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FICHAS_INICIALES = 1000;

app.get('/', (req, res) => {
    res.send('¡Servidor Backend de Truco Argentino funcionando con éxito!');
});

// --- SISTEMA DE BOTS AUTÓNOMOS (LOBBY E IA INVISIBLE) ---

const NOMBRES_BOTS = [
    "Lucas_Carp", "El_Tano_99", "Juani_Ok", "Marcos_Cab", 
    "Gonza_14", "Santi_RP", "Faku_99", "Tomi_Boca", "Nacho_Est", "Pablitox"
];

const APUESTAS_BOTS = [100, 250, 500, 1000, 2000, 5000, 10000];
const METAS_BOTS = [15, 30];

// Mazo de referencia para simular las jugadas del bot en el servidor
const MAZO_BOT = [
    { id: '1E', poder: 14, envido: 1, palo: 'E' }, { id: '1B', poder: 13, envido: 1, palo: 'B' },
    { id: '7E', poder: 12, envido: 7, palo: 'E' }, { id: '7O', poder: 11, envido: 7, palo: 'O' },
    { id: '3E', poder: 10, envido: 3, palo: 'E' }, { id: '3B', poder: 10, envido: 3, palo: 'B' },
    { id: '3C', poder: 10, envido: 3, palo: 'C' }, { id: '3O', poder: 10, envido: 3, palo: 'O' },
    { id: '2E', poder: 9, envido: 2, palo: 'E' }, { id: '2B', poder: 9, envido: 2, palo: 'B' },
    { id: '2C', poder: 9, envido: 2, palo: 'C' }, { id: '2O', poder: 9, envido: 2, palo: 'O' },
    { id: '1C', poder: 8, envido: 1, palo: 'C' }, { id: '1O', poder: 8, envido: 1, palo: 'O' },
    { id: '12E', poder: 7, envido: 0, palo: 'E' }, { id: '12B', poder: 7, envido: 0, palo: 'B' },
    { id: '12C', poder: 7, envido: 0, palo: 'C' }, { id: '12O', poder: 7, envido: 0, palo: 'O' },
    { id: '11E', poder: 6, envido: 0, palo: 'E' }, { id: '11B', poder: 6, envido: 0, palo: 'B' },
    { id: '11C', poder: 6, envido: 0, palo: 'C' }, { id: '11O', poder: 6, envido: 0, palo: 'O' },
    { id: '10E', poder: 5, envido: 0, palo: 'E' }, { id: '10B', poder: 5, envido: 0, palo: 'B' },
    { id: '10C', poder: 5, envido: 0, palo: 'C' }, { id: '10O', poder: 5, envido: 0, palo: 'O' },
    { id: '7C', poder: 4, envido: 7, palo: 'C' }, { id: '7B', poder: 4, envido: 7, palo: 'B' },
    { id: '6E', poder: 3, envido: 6, palo: 'E' }, { id: '6B', poder: 3, envido: 6, palo: 'B' },
    { id: '6C', poder: 3, envido: 6, palo: 'C' }, { id: '6O', poder: 3, envido: 6, palo: 'O' },
    { id: '5E', poder: 2, envido: 5, palo: 'E' }, { id: '5B', poder: 2, envido: 5, palo: 'B' },
    { id: '5C', poder: 2, envido: 5, palo: 'C' }, { id: '5O', poder: 2, envido: 5, palo: 'O' },
    { id: '4E', poder: 1, envido: 4, palo: 'E' }, { id: '4B', poder: 1, envido: 4, palo: 'B' },
    { id: '4C', poder: 1, envido: 4, palo: 'C' }, { id: '4O', poder: 1, envido: 4, palo: 'O' }
];

async function mantenerSalasBotActivas() {
    try {
        const { data: salas, error } = await supabase.from('salas').select('*');
        if (error || !salas) return;

        const salasBotEsperando = salas.filter(s => {
            try {
                const paquete = JSON.parse(s.estado);
                return paquete.esBot && paquete.tipo === 'ESPERANDO_J2';
            } catch (e) {
                return false;
            }
        });

        if (salasBotEsperando.length < 4) {
            const idGen = Math.floor(Math.random() * 89999) + 10000;
            const nombreBot = NOMBRES_BOTS[Math.floor(Math.random() * NOMBRES_BOTS.length)];
            const apuestaAleatoria = APUESTAS_BOTS[Math.floor(Math.random() * APUESTAS_BOTS.length)];
            const metaAleatoria = METAS_BOTS[Math.floor(Math.random() * METAS_BOTS.length)];

            const estadoBot = {
                tipo: 'ESPERANDO_J2',
                esBot: true,
                ptsJ1: 0,
                ptsJ2: 0,
                rondaActual: 1,
                manoJugador: 'J1',
                turnoActual: 'J1',
                nombreJ1: nombreBot,
                nombreJ2: 'Rival',
                cartasJ1: [],
                cartasJ2: [],
                mesaR1: { J1: null, J2: null },
                mesaR2: { J1: null, J2: null },
                mesaR3: { J1: null, J2: null },
                finMano: false,
                mensajeEstado: 'Esperando oponente...'
            };

            await supabase.from('salas').insert([{
                id: idGen,
                estado: JSON.stringify(estadoBot),
                jugador1: 'BOT_SISTEMA',
                apuesta: apuestaAleatoria,
                meta: metaAleatoria
            }]);
        }
    } catch (err) {
        console.error('Error gestionando salas de bots:', err);
    }
}

setInterval(mantenerSalasBotActivas, 15000);

// Endpoint para unirse a una sala de bot y repartir cartas automáticamente
app.post('/unirse-sala-bot', async (req, res) => {
    try {
        const { salaId, usuarioId, nombreUsuario } = req.body;
        if (!salaId) return res.status(400).json({ error: 'Falta salaId' });

        const { data: sala, error } = await supabase.from('salas').select('*').eq('id', salaId).single();
        if (error || !sala) return res.status(404).json({ error: 'Sala no encontrada' });

        let estado = JSON.parse(sala.estado);
        if (!estado.esBot) return res.status(400).json({ error: 'No es una sala de bot' });

        const mazoMezclado = [...MAZO_BOT].sort(() => Math.random() - 0.5);
        const cJ1 = [mazoMezclado[0], mazoMezclado[1], mazoMezclado[2]];
        const cJ2 = [mazoMezclado[3], mazoMezclado[4], mazoMezclado[5]];

        estado.tipo = 'EN_PARTIDA';
        estado.nombreJ2 = nombreUsuario || 'Jugador';
        estado.cartasJ1 = cJ1;
        estado.cartasJ2 = cJ2;
        estado.cartasInicialesJ1 = [...cJ1];
        estado.cartasInicialesJ2 = [...cJ2];
        estado.rondaActual = 1;
        estado.manoJugador = 'J1';
        estado.turnoActual = 'J1';
        estado.mesaR1 = { J1: null, J2: null };
        estado.mesaR2 = { J1: null, J2: null };
        estado.mesaR3 = { J1: null, J2: null };
        estado.finMano = false;
        estado.mensajeEstado = '¡Partida iniciada contra el bot!';

        await supabase.from('salas').update({ 
            estado: JSON.stringify(estado),
            jugador2: usuarioId 
        }).eq('id', salaId);

        setTimeout(() => procesarJugadaBot(salaId), 2000);

        res.json({ ok: true, estado });
    } catch (err) {
        console.error("Error en /unirse-sala-bot:", err);
        res.status(500).json({ error: err.message });
    }
});

// Función interna para que el bot juegue de forma inteligente
async function procesarJugadaBot(salaId) {
    try {
        const { data: sala } = await supabase.from('salas').select('*').eq('id', salaId).single();
        if (!sala) return;

        let est = JSON.parse(sala.estado);
        if (!est.esBot || est.turnoActual !== 'J1' || est.finMano) return;

        const cartasBot = est.cartasJ1;
        if (!cartasBot || cartasBot.length === 0) return;

        const ronda = est.rondaActual;
        const mesaRonda = est[`mesaR${ronda}`];
        let cartaAElegir = cartasBot[0];

        if (mesaRonda && mesaRonda.J2) {
            const poderHumano = mesaRonda.J2.poder;
            const mayores = cartasBot.filter(c => c.poder > poderHumano).sort((a, b) => a.poder - b.poder);
            cartaAElegir = mayores.length > 0 ? mayores[0] : cartasBot.sort((a, b) => a.poder - b.poder)[0];
        } else {
            cartaAElegir = cartasBot.sort((a, b) => b.poder - a.poder)[0];
        }

        est.cartasJ1 = est.cartasJ1.filter(c => c.id !== cartaAElegir.id);
        if (ronda === 1) est.mesaR1.J1 = cartaAElegir;
        else if (ronda === 2) est.mesaR2.J1 = cartaAElegir;
        else if (ronda === 3) est.mesaR3.J1 = cartaAElegir;

        est.turnoActual = 'J2';
        est.mensajeEstado = '¡Tu turno!';

        await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
    } catch (e) {
        console.error("Error en procesarJugadaBot:", e);
    }
}

// Endpoint para procesar la jugada del bot luego de que tira el usuario humano
app.post('/jugada-bot', async (req, res) => {
    try {
        const { salaId } = req.body;
        const { data: sala } = await supabase.from('salas').select('*').eq('id', salaId).single();
        if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });

        let est = JSON.parse(sala.estado);
        if (!est.esBot || est.turnoActual !== 'J1' || est.finMano) {
            return res.json({ ok: false });
        }

        const cartasBot = est.cartasJ1;
        if (!cartasBot || cartasBot.length === 0) return res.json({ ok: false });

        const ronda = est.rondaActual;
        const mesaRonda = est[`mesaR${ronda}`];
        let cartaAElegir = cartasBot[0];

        if (mesaRonda && mesaRonda.J2) {
            const poderHumano = mesaRonda.J2.poder;
            const mayores = cartasBot.filter(c => c.poder > poderHumano).sort((a, b) => a.poder - b.poder);
            cartaAElegir = mayores.length > 0 ? mayores[0] : cartasBot.sort((a, b) => a.poder - b.poder)[0];
        } else {
            cartaAElegir = cartasBot.sort((a, b) => b.poder - a.poder)[0];
        }

        est.cartasJ1 = est.cartasJ1.filter(c => c.id !== cartaAElegir.id);
        if (ronda === 1) est.mesaR1.J1 = cartaAElegir;
        else if (ronda === 2) est.mesaR2.J1 = cartaAElegir;
        else if (ronda === 3) est.mesaR3.J1 = cartaAElegir;

        const c1 = est[`mesaR${est.rondaActual}`].J1;
        const c2 = est[`mesaR${est.rondaActual}`].J2;

        if (c1 && c2) {
            let ganadorRonda = null;
            if (c1.poder > c2.poder) ganadorRonda = 'J1';
            else if (c2.poder > c1.poder) ganadorRonda = 'J2';
            else ganadorRonda = 'PARDA';

            est.turnoActual = ganadorRonda !== 'PARDA' ? ganadorRonda : est.manoJugador;
            
            const g1 = (est.mesaR1.J1 && est.mesaR1.J2) ? (est.mesaR1.J1.poder > est.mesaR1.J2.poder ? 'J1' : (est.mesaR1.J2.poder > est.mesaR1.J1.poder ? 'J2' : 'PARDA')) : null;
            const g2 = est.rondaActual >= 2 && est.mesaR2.J1 && est.mesaR2.J2 ? (est.mesaR2.J1.poder > est.mesaR2.J2.poder ? 'J1' : (est.mesaR2.J2.poder > est.mesaR2.J1.poder ? 'J2' : 'PARDA')) : null;
            
            let ganadorMano = null;
            if (est.rondaActual === 2) {
                if (g1 === 'J1' && g2 === 'J1') ganadorMano = 'J1';
                else if (g1 === 'J2' && g2 === 'J2') ganadorMano = 'J2';
                else if (g1 === 'J1' && g2 === 'PARDA') ganadorMano = 'J1';
                else if (g1 === 'J2' && g2 === 'PARDA') ganadorMano = 'J2';
                else if (g1 === 'PARDA' && g2 !== 'PARDA') ganadorMano = g2;
            } else if (est.rondaActual === 3) {
                const g3 = (est.mesaR3.J1 && est.mesaR3.J2) ? (est.mesaR3.J1.poder > est.mesaR3.J2.poder ? 'J1' : (est.mesaR3.J2.poder > est.mesaR3.J1.poder ? 'J2' : 'PARDA')) : null;
                if (g3 !== 'PARDA') ganadorMano = g3;
                else ganadorMano = g1 !== 'PARDA' ? g1 : est.manoJugador;
            }

            if (ganadorMano) {
                const ptsAOtorgar = est.puntosTrucoAceptado || 1;
                if (ganadorMano === 'J1') est.ptsJ1 += ptsAOtorgar;
                else est.ptsJ2 += ptsAOtorgar;
                est.mensajeEstado = `¡Ganó la mano ${ganadorMano === 'J1' ? est.nombreJ1 : est.nombreJ2}! (+${ptsAOtorgar} pts)`;
                est.finMano = true;
            } else if (est.rondaActual < 3) {
                est.rondaActual += 1;
            }
        } else {
            est.turnoActual = 'J2';
            est.mensajeEstado = '¡Tu turno!';
        }

        await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
        res.json({ ok: true });
    } catch (e) {
        console.error("Error en /jugada-bot:", e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoints básicos de control de usuario y pagos
app.post('/obtener-usuario', async (req, res) => {
    try {
        const { usuarioId, email } = req.body;
        if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

        const { data: userData } = await supabase.from('perfiles').select('*').eq('usuarios', usuarioId).single();
        if (userData) return res.json(userData);

        const { data: nuevoUsuario } = await supabase.from('perfiles').upsert([{ 
            usuarios: usuarioId, email: email || `${usuarioId}@jugador.com`, fichas: FICHAS_INICIALES 
        }]).select().single();
        return res.json(nuevoUsuario);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/jugar-gratis', async (req, res) => {
    res.json({ exito: true, costo: 0 });
});

app.post('/crear-preferencia-mp', async (req, res) => {
    try {
        const cantidad = Number(req.body.cantidad || 500);
        const preference = new Preference(client);
        const resultado = await preference.create({
            body: {
                items: [{ title: `${cantidad} Fichas Truco`, quantity: 1, unit_price: cantidad, currency_id: 'ARS' }],
                back_urls: { success: 'https://trucoargentino.site/?status=approved', failure: 'https://trucoargentino.site/?status=failure', pending: 'https://trucoargentino.site/?status=pending' },
                auto_return: 'approved',
                external_reference: String(req.body.usuarioId || 'demo')
            }
        });
        res.json({ init_point: resultado.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Truco corriendo en puerto ${PORT}`);
});