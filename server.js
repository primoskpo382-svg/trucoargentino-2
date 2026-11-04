const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_DE_PRUEBA_LOCAL' 
});

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://olvieohhsybycmyojdpo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FICHAS_INICIALES = 1000;

app.get('/', (req, res) => {
    res.send('¡Servidor Backend de Truco Argentino (con Bots Tramposos) funcionando con éxito!');
});

// ==========================================
// CONFIGURACIÓN DE MAZO Y BOTS
// ==========================================

const NOMBRES_BOTS = [
    "Lucas_Carp", "El_Tano_99", "Juani_Ok", "Marcos_Cab", 
    "Gonza_14", "Santi_RP", "Faku_99", "Tomi_Boca", "Nacho_Est", "Pablitox"
];

const APUESTAS_BOTS = [0, 100, 250, 500, 1000, 2000, 5000];
const METAS_BOTS = [15, 30];

const MAZO_BOT = [
    { id: '1E', txt: '1 Espada', poder: 14, envido: 1, palo: 'E', img: 'casrtas/3B9CB9AE-9416-4AEE-9D93-DF7E2B5D25D8.png' },
    { id: '1B', txt: '1 Basto', poder: 13, envido: 1, palo: 'B', img: 'casrtas/IMG_7083.JPG' },
    { id: '7E', txt: '7 Espada', poder: 12, envido: 7, palo: 'E', img: 'casrtas/889FDC04-602F-4609-856C-466B356DDFF0.png' },
    { id: '7O', txt: '7 Oro', poder: 11, envido: 7, palo: 'O', img: 'casrtas/IMG_7067.JPG' },
    { id: '3E', txt: '3 Espada', poder: 10, envido: 3, palo: 'E', img: 'casrtas/78E4021C-B66A-461F-9C0E-5A2735538D67.png' },
    { id: '3B', txt: '3 Basto', poder: 10, envido: 3, palo: 'B', img: 'casrtas/IMG_7085.JPG' },
    { id: '3C', txt: '3 Copa', poder: 10, envido: 3, palo: 'C', img: 'casrtas/D8876D6B-A6B0-4388-8B1C-7FD7E772843C.png' },
    { id: '3O', txt: '3 Oro', poder: 10, envido: 3, palo: 'O', img: 'casrtas/IMG_7063.JPG' },
    { id: '2E', txt: '2 Espada', poder: 9, envido: 2, palo: 'E', img: 'casrtas/280DF667-8528-4D10-BAC1-3D3BEE723E21.png' },
    { id: '2B', txt: '2 Basto', poder: 9, envido: 2, palo: 'B', img: 'casrtas/IMG_7084.JPG' },
    { id: '2C', txt: '2 Copa', poder: 9, envido: 2, palo: 'C', img: 'casrtas/65D989B8-48D9-4ED0-A9E9-39F4F07D2B1C.png' },
    { id: '2O', txt: '2 Oro', poder: 9, envido: 2, palo: 'O', img: 'casrtas/IMG_7062.JPG' },
    { id: '1C', txt: '1 Copa', poder: 8, envido: 1, palo: 'C', img: 'casrtas/0A6E7B15-5DF8-490D-95E6-6876FDF4C6EE.png' },
    { id: '1O', txt: '1 Oro', poder: 8, envido: 1, palo: 'O', img: 'casrtas/IMG_7061.JPG' },
    { id: '12E', txt: '12 Espada', poder: 7, envido: 0, palo: 'E', img: 'casrtas/IMG_5814.JPG' },
    { id: '12B', txt: '12 Basto', poder: 7, envido: 0, palo: 'B', img: 'casrtas/IMG_7092.JPG' },
    { id: '12C', txt: '12 Copa', poder: 7, envido: 0, palo: 'C', img: 'casrtas/7F7C1D19-F1D2-4DC8-813C-FD9FD595167A.png' },
    { id: '12O', txt: '12 Oro', poder: 7, envido: 0, palo: 'O', img: 'casrtas/IMG_7081.JPG' },
    { id: '11E', txt: '11 Espada', poder: 6, envido: 0, palo: 'E', img: 'casrtas/56CFB2BF-287E-427A-99F0-F70A20B2238A.png' },
    { id: '11B', txt: '11 Basto', poder: 6, envido: 0, palo: 'B', img: 'casrtas/IMG_7091.JPG' },
    { id: '11C', txt: '11 Copa', poder: 6, envido: 0, palo: 'C', img: 'casrtas/C26265A6-680F-40B9-B25B-DAC0BDF3ADA1.png' },
    { id: '11O', txt: '11 Oro', poder: 6, envido: 0, palo: 'O', img: 'casrtas/IMG_7069.JPG' },
    { id: '10E', txt: '10 Espada', poder: 5, envido: 0, palo: 'E', img: 'casrtas/D922D71F-DDE0-4F93-9A48-13C2C25BAE0A.png' },
    { id: '10B', txt: '10 Basto', poder: 5, envido: 0, palo: 'B', img: 'casrtas/IMG_7090.JPG' },
    { id: '10C', txt: '10 Copa', poder: 5, envido: 0, palo: 'C', img: 'casrtas/D90F1F7A-8238-43D1-A6D2-564040C3D3E8.png' },
    { id: '10O', txt: '10 Oro', poder: 5, envido: 0, palo: 'O', img: 'casrtas/IMG_7068.JPG' },
    { id: '7C', txt: '7 Copa', poder: 4, envido: 7, palo: 'C', img: 'casrtas/C090B8F3-4D08-43DD-AFBD-A54B336DF712.png' },
    { id: '7B', txt: '7 Basto', poder: 4, envido: 7, palo: 'B', img: 'casrtas/IMG_7089.JPG' },
    { id: '6E', txt: '6 Espada', poder: 3, envido: 6, palo: 'E', img: 'casrtas/F6EB3C3A-FF6B-4A16-A897-066D2EA5D252.png' },
    { id: '6B', txt: '6 Basto', poder: 3, envido: 6, palo: 'B', img: 'casrtas/IMG_7088.JPG' },
    { id: '6C', txt: '6 Copa', poder: 3, envido: 6, palo: 'C', img: 'casrtas/D253ABD0-8E05-4E98-A868-D248C7B5F81D.png' },
    { id: '6O', txt: '6 Oro', poder: 3, envido: 6, palo: 'O', img: 'casrtas/IMG_7066.JPG' },
    { id: '5E', txt: '5 Espada', poder: 2, envido: 5, palo: 'E', img: 'casrtas/32688BF2-F484-4EC5-8A1A-0BACFFC419C2.png' },
    { id: '5B', txt: '5 Basto', poder: 2, envido: 5, palo: 'B', img: 'casrtas/IMG_7087.JPG' },
    { id: '5C', txt: '5 Copa', poder: 2, envido: 5, palo: 'C', img: 'casrtas/F636396C-5FCA-408D-BE11-F5555E57F457.png' },
    { id: '5O', txt: '5 Oro', poder: 2, envido: 5, palo: 'O', img: 'casrtas/IMG_7065.JPG' },
    { id: '4E', txt: '4 Espada', poder: 1, envido: 4, palo: 'E', img: 'casrtas/757A2F70-FE42-4A1E-86BB-BBB4A48BF042.png' },
    { id: '4B', txt: '4 Basto', poder: 1, envido: 4, palo: 'B', img: 'casrtas/IMG_7086.JPG' },
    { id: '4C', txt: '4 Copa', poder: 1, envido: 4, palo: 'C', img: 'casrtas/45539003-D55D-4ED9-A77C-9CF91A986DBF.png' },
    { id: '4O', txt: '4 Oro', poder: 1, envido: 4, palo: 'O', img: 'casrtas/IMG_7064.JPG' }
];

// Auxiliar para calcular tantos de envido
function calcularDetalleEnvido(cartas) {
    if (!cartas || cartas.length === 0) return { puntos: 0, cartasUsadas: [] };
    let max = 0;
    let cartasUsadas = [cartas[0]];
    const palos = { E: [], B: [], C: [], O: [] };
    
    cartas.forEach(c => {
        if (c && c.palo) palos[c.palo].push(c);
    });

    for (let p in palos) {
        const vals = palos[p];
        if (vals.length >= 2) {
            vals.sort((a, b) => b.envido - a.envido);
            const suma = 20 + vals[0].envido + vals[1].envido;
            if (suma > max) {
                max = suma;
                cartasUsadas = [vals[0], vals[1]];
            }
        } else if (vals.length === 1 && vals[0].envido > max) {
            max = vals[0].envido;
            cartasUsadas = [vals[0]];
        }
    }
    return { puntos: max, cartasUsadas };
}

// ==========================================
// SISTEMA AUTOMÁTICO DE SALAS Y MANTENIMIENTO
// ==========================================

async function mantenerSalasBotActivas() {
    try {
        const { data: salas, error } = await supabase.from('salas').select('*');
        if (error || !salas) return;

        // 1. Crear salas si hay menos de 5 disponibles
        const salasBotEsperando = salas.filter(s => {
            try {
                const paquete = JSON.parse(s.estado);
                return paquete.esBot && paquete.tipo === 'ESPERANDO_J2';
            } catch (e) {
                return false;
            }
        });

        if (salasBotEsperando.length < 5) {
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
                cartasInicialesJ1: [],
                cartasInicialesJ2: [],
                mesaR1: { J1: null, J2: null },
                mesaR2: { J1: null, J2: null },
                mesaR3: { J1: null, J2: null },
                cantosPendientes: null,
                nivelTruco: 1,
                puntosTrucoAceptado: 1,
                ultimoQueCantoTruco: null,
                puntosEnvidoEnJuego: 0,
                puntosEnvidoRechazo: 1,
                envidoCantado: false,
                historialEnvido: [],
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

        // 2. Monitorear partidas activas donde el Bot debe actuar
        const salasBotEnJuego = salas.filter(s => {
            try {
                const paquete = JSON.parse(s.estado);
                return paquete.esBot && paquete.tipo === 'EN_PARTIDA' && !paquete.finMano;
            } catch (e) {
                return false;
            }
        });

        for (let sala of salasBotEnJuego) {
            await procesarTurnoBotGlobal(sala.id);
        }

    } catch (err) {
        console.error('Error gestionando salas de bots:', err);
    }
}

// Bucle continuo para revisar salas y jugadas de bot cada 3 segundos
setInterval(mantenerSalasBotActivas, 3000);

// ==========================================
// MOTOR DE INTELIGENCIA ARTIFICIAL TRAMPOSA (J1 = BOT)
// ==========================================

async function procesarTurnoBotGlobal(salaId) {
    try {
        const { data: sala } = await supabase.from('salas').select('*').eq('id', salaId).single();
        if (!sala) return;

        let est = JSON.parse(sala.estado);
        if (!est.esBot || est.finMano) return;

        // A. SI EL JUGADOR HUMANO (J2) HIZO UN CANTO PENDIENTE PARA J1 (EL BOT)
        if (est.cantosPendientes && est.cantosPendientes.para === 'J1') {
            await responderCantoBot(salaId, est, sala.meta);
            return;
        }

        // B. SI ES EL TURNO DEL BOT DE JUGAR CARTA O CANTAR
        if (est.turnoActual === 'J1' && !est.cantosPendientes) {
            // Evaluamos si el bot quiere cantar algo antes de tirar la carta
            const cantoIniciado = await intentarCantarBot(salaId, est, sala.meta);
            if (cantoIniciado) return; // Si cantó algo, esperamos la respuesta del humano

            // Si no canta nada, tiramos la mejor carta tramposa
            await tirarCartaBotTramposo(salaId, est);
        }
    } catch (e) {
        console.error("Error en procesarTurnoBotGlobal:", e);
    }
}

// Lógica para que el bot cante Envido o Truco a propósito
async function intentarCantarBot(salaId, est, metaPartida) {
    // 1. Cantar Envido en Ronda 1 si conviene o para presionar
    if (est.rondaActual === 1 && !est.envidoCantado && est.cartasJ1.length === 3) {
        const envBot = calcularDetalleEnvido(est.cartasJ1).puntos;
        const envHumano = calcularDetalleEnvido(est.cartasJ2).puntos;

        // Si el bot ve que le gana al humano en el envido
        if (envBot >= envHumano || envBot >= 28) {
            est.envidoCantado = true;
            est.historialEnvido = ['Envido'];
            est.puntosEnvidoEnJuego = 2;
            est.puntosEnvidoRechazo = 1;
            est.cantosPendientes = { tipo: 'Envido', de: 'J1', para: 'J2' };
            est.ultimoCantoGlobal = { jugador: 'J1', texto: 'Envido' };
            est.mensajeEstado = `${est.nombreJ1}: ¡Envido!`;

            await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
            return true;
        }
    }

    // 2. Cantar Truco si el bot ve que sus cartas superan a las del humano
    if (est.nivelTruco === 1 && est.ultimoQueCantoTruco !== 'J1') {
        const maxPoderBot = Math.max(...est.cartasJ1.map(c => c.poder));
        const maxPoderHumano = Math.max(...est.cartasJ2.map(c => c.poder));

        if (maxPoderBot >= maxPoderHumano || Math.random() < 0.3) {
            est.cantosPendientes = { tipo: 'Truco!', de: 'J1', para: 'J2' };
            est.ultimoQueCantoTruco = 'J1';
            est.ultimoCantoGlobal = { jugador: 'J1', texto: 'Truco!' };
            est.mensajeEstado = `${est.nombreJ1}: ¡Truco!`;

            await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
            return true;
        }
    }

    return false;
}

// Lógica para responder cantos del humano (J2 -> J1)
async function responderCantoBot(salaId, est, metaPartida) {
    const tipo = est.cantosPendientes.tipo;
    let acepta = true;

    // A. Respuesta a ENVIDO
    if (tipo.includes('Envido') || tipo.includes('envido')) {
        const envBot = calcularDetalleEnvido(est.cartasInicialesJ1.length ? est.cartasInicialesJ1 : est.cartasJ1).puntos;
        const envHumano = calcularDetalleEnvido(est.cartasInicialesJ2.length ? est.cartasInicialesJ2 : est.cartasJ2).puntos;

        // TRAMPA: Si el bot sabe que le gana o empata siendo mano, acepta. Sino, acepta si tiene buen puntaje
        if (envBot > envHumano || (envBot === envHumano && est.manoJugador === 'J1') || envBot >= 27) {
            acepta = true;
        } else {
            acepta = false;
        }

        est.cantosPendientes = null;
        est.envidoCantado = true;
        est.ultimoCantoGlobal = { jugador: 'J1', texto: acepta ? 'Quiero' : 'No quiero' };

        if (acepta) {
            const pts = est.puntosEnvidoEnJuego || 2;
            if (envBot >= envHumano) {
                est.ptsJ1 += pts;
                est.mensajeEstado = `¡${est.nombreJ1} ganó el envido con ${envBot}! (+${pts} pts)`;
                est.envidoGanadorInfo = { ganador: 'J1', puntos: envBot, cartas: calcularDetalleEnvido(est.cartasJ1).cartasUsadas };
            } else {
                est.ptsJ2 += pts;
                est.mensajeEstado = `¡${est.nombreJ2} ganó el envido con ${envHumano}! (+${pts} pts)`;
                est.envidoGanadorInfo = { ganador: 'J2', puntos: envHumano, cartas: calcularDetalleEnvido(est.cartasJ2).cartasUsadas };
            }
        } else {
            const ptsRechazo = est.puntosEnvidoRechazo || 1;
            est.ptsJ2 += ptsRechazo;
            est.mensajeEstado = `${est.nombreJ1}: No quiero. (+${ptsRechazo} pt a ${est.nombreJ2})`;
        }
    } 
    // B. Respuesta a TRUCO / RE TRUCO / VALE CUATRO
    else if (tipo.includes('Truco') || tipo.includes('re truco') || tipo.includes('Vale')) {
        const cartasBot = est.cartasJ1;
        const cartasHumano = est.cartasJ2;

        const sumPoderBot = cartasBot.reduce((a, b) => a + b.poder, 0);
        const sumPoderHumano = cartasHumano.reduce((a, b) => a + b.poder, 0);

        // El bot acepta casi siempre salvo que sus cartas sean paupérrimas comparadas a las del humano
        if (sumPoderBot >= sumPoderHumano - 2 || Math.random() < 0.7) {
            acepta = true;
            if (tipo === 'Truco!') { est.nivelTruco = 2; est.puntosTrucoAceptado = 2; }
            else if (tipo === 'Quiero re truco') { est.nivelTruco = 3; est.puntosTrucoAceptado = 3; }
            else if (tipo === 'Vale Cuatro!') { est.nivelTruco = 4; est.puntosTrucoAceptado = 4; }

            est.cantosPendientes = null;
            est.mensajeEstado = `${est.nombreJ1}: ¡Quiero!`;
        } else {
            acepta = false;
            est.cantosPendientes = null;
            const ptsAbonar = est.puntosTrucoAceptado || 1;
            est.ptsJ2 += ptsAbonar;
            est.mensajeEstado = `${est.nombreJ1}: No quiero. (+${ptsAbonar} pt a ${est.nombreJ2})`;
            est.finMano = true;
        }
    }

    await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
}

// Selección infalible de carta
async function tirarCartaBotTramposo(salaId, est) {
    const cartasBot = est.cartasJ1;
    if (!cartasBot || cartasBot.length === 0) return;

    const ronda = est.rondaActual;
    const mesaRonda = est[`mesaR${ronda}`];
    let cartaAElegir = cartasBot[0];

    // TRAMPA: Si el humano (J2) ya tiró carta en esta ronda
    if (mesaRonda && mesaRonda.J2) {
        const poderHumano = mesaRonda.J2.poder;
        // Buscamos la carta de menor poder que le gane a la del humano
        const mayores = cartasBot.filter(c => c.poder > poderHumano).sort((a, b) => a.poder - b.poder);
        
        if (mayores.length > 0) {
            cartaAElegir = mayores[0]; // Le gana usando lo justo y necesario
        } else {
            // Si no puede ganarle, tira su carta más baja ("descarta la peor")
            cartaAElegir = cartasBot.sort((a, b) => a.poder - b.poder)[0];
        }
    } else {
        // Si el bot abre la ronda, tira su carta más fuerte para marcar cancha
        cartaAElegir = cartasBot.sort((a, b) => b.poder - a.poder)[0];
    }

    // Retiramos la carta elegida de la mano del bot
    est.cartasJ1 = est.cartasJ1.filter(c => c.id !== cartaAElegir.id);

    if (ronda === 1) est.mesaR1.J1 = cartaAElegir;
    else if (ronda === 2) est.mesaR2.J1 = cartaAElegir;
    else if (ronda === 3) est.mesaR3.J1 = cartaAElegir;

    // Verificamos resolución de la ronda o pase de turno
    const c1 = est[`mesaR${ronda}`].J1;
    const c2 = est[`mesaR${ronda}`].J2;

    if (c1 && c2) {
        evaluarFinDeRondaBot(est);
    } else {
        est.turnoActual = 'J2';
        est.mensajeEstado = '¡Tu turno!';
    }

    await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
}

// Evaluación de fin de ronda para el Bot
function evaluarFinDeRondaBot(est) {
    const r = est.rondaActual;
    const c1 = est[`mesaR${r}`].J1;
    const c2 = est[`mesaR${r}`].J2;

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
}

// ==========================================
// ENDPOINTS API EXPRES
// ==========================================

// Endpoint para unirse a sala de bot y repartir cartas
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
        estado.turnoActual = 'J1'; // Empieza tirando el bot
        estado.mesaR1 = { J1: null, J2: null };
        estado.mesaR2 = { J1: null, J2: null };
        estado.mesaR3 = { J1: null, J2: null };
        estado.finMano = false;
        estado.puntosTrucoAceptado = 1;
        estado.mensajeEstado = '¡Partida iniciada contra el bot!';

        await supabase.from('salas').update({ 
            estado: JSON.stringify(estado),
            jugador2: usuarioId 
        }).eq('id', salaId);

        // Turno automático inicial del bot
        setTimeout(() => procesarTurnoBotGlobal(salaId), 1500);

        res.json({ ok: true, estado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint opcional para forzar jugada de bot desde el cliente si hiciera falta
app.post('/jugada-bot', async (req, res) => {
    try {
        const { salaId } = req.body;
        await procesarTurnoBotGlobal(salaId);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Control de usuario
app.post('/obtener-usuario', async (req, res) => {
    try {
        const { usuarioId, email } = req.body;
        if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

        const { data: userData } = await supabase.from('perfiles').select('*').eq('usuarios', usuarioId).single();
        if (userData) return res.json(userData);

        const { data: nuevoUsuario } = await supabase.from('perfiles').upsert([{ 
            usuarios: usuarioId, email: email || `${usuarioId}@jugador.com`, fichas: FICHAS_INICIALES, nombre: '' 
        }]).select().single();
        return res.json(nuevoUsuario);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Solicitud de retiro de fichas
app.post('/solicitar-retiro', async (req, res) => {
    try {
        const { usuarioId, cantidad, destino } = req.body;
        if (!usuarioId || !cantidad || !destino) {
            return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
        }

        const { data: perfil, error: errPerfil } = await supabase.from('perfiles').select('*').eq('usuarios', usuarioId).single();
        if (errPerfil || !perfil) return res.status(404).json({ error: 'Usuario no encontrado.' });

        if (perfil.fichas < cantidad) {
            return res.status(400).json({ error: 'Saldo insuficiente.' });
        }

        await supabase.from('retiros').insert([{
            usuario_id: usuarioId,
            monto: cantidad,
            destino: destino,
            estado: 'pendiente',
            fecha: new Date().toISOString()
        }]);

        res.json({ ok: true, mensaje: 'Solicitud registrada con éxito.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Integración Mercado Pago
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
    console.log(`Servidor corriendo en puerto ${PORT}`);
});