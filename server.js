const express = require('express');
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

        // Mantener al menos 4 salas de bots activas en el lobby con diferentes apuestas
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

// Ejecutar el creador automático cada 15 segundos
setInterval(mantenerSalasBotActivas, 15000);

// Lógica de Inteligencia del Bot (Gana siempre analizando las cartas de ambos)
async function procesarJugadaBot(salaId, estado) {
    if (!estado.esBot || estado.turnoActual !== 'J1' || estado.finMano) return;

    // Simular tiempo de pensamiento humano (entre 2 y 4 segundos)
    setTimeout(async () => {
        try {
            const { data: salaActual } = await supabase.from('salas').select('*').eq('id', salaId).single();
            if (!salaActual) return;
            let est = JSON.parse(salaActual.estado);
            if (est.turnoActual !== 'J1' || est.finMano) return;

            // El bot ve las cartas del jugador humano (J2) y las suyas (J1) para asegurar la victoria
            const cartasBot = est.cartasJ1;
            if (!cartasBot || cartasBot.length === 0) return;

            const ronda = est.rondaActual;
            const mesaRonda = est[`mesaR${ronda}`];

            let cartaAElegir = cartasBot[0];

            if (mesaRonda && mesaRonda.J2) {
                // Si el humano ya tiró, el bot busca la carta justa para ganarle o la menor si no puede
                const poderHumano = mesaRonda.J2.poder;
                const mayores = cartasBot.filter(c => c.poder > poderHumano).sort((a, b) => a.poder - b.poder);
                cartaAElegir = mayores.length > 0 ? mayores[0] : cartasBot.sort((a, b) => a.poder - b.poder)[0];
            } else {
                // Si sale el bot, tira una carta estratégica
                cartaAElegir = cartasBot.sort((a, b) => b.poder - a.poder)[0];
            }

            // Remover carta de la mano del bot
            est.cartasJ1 = est.cartasJ1.filter(c => c.id !== cartaAElegir.id);
            if (ronda === 1) est.mesaR1.J1 = cartaAElegir;
            else if (ronda === 2) est.mesaR2.J1 = cartaAElegir;
            else if (ronda === 3) est.mesaR3.J1 = cartaAElegir;

            // Cambiar turno al jugador humano
            est.turnoActual = 'J2';
            est.mensajeEstado = '¡Tu turno!';

            await supabase.from('salas').update({ estado: JSON.stringify(est) }).eq('id', salaId);
        } catch (e) {
            console.error("Error en jugada de bot:", e);
        }
    }, 2500);
}

// Endpoint para consultar saldo u obtener usuario con fichas iniciales si es nuevo
app.post('/obtener-usuario', async (req, res) => {
    try {
        const { usuarioId, email } = req.body;
        if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

        const { data: userData } = await supabase
            .from('perfiles')
            .select('*')
            .eq('usuarios', usuarioId)
            .single();

        if (userData) {
            return res.json(userData);
        } else {
            const { data: nuevoUsuario, error: createError } = await supabase
                .from('perfiles')
                .upsert([{ 
                    usuarios: usuarioId, 
                    email: email || `${usuarioId}@jugador.com`, 
                    fichas: FICHAS_INICIALES 
                }])
                .select()
                .single();

            if (createError) {
                console.error("Error al crear perfil nuevo:", createError);
                return res.status(500).json({ error: createError.message });
            }
            return res.json(nuevoUsuario);
        }
    } catch (err) {
        console.error("Error en /obtener-usuario:", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para partidas de 0 fichas o modo gratuito
const jugarGratisHandler = async (req, res) => {
    try {
        const { usuarioId } = req.body;
        if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

        const { data: userData } = await supabase
            .from('perfiles')
            .select('*')
            .eq('usuarios', usuarioId)
            .single();

        if (!userData) {
            await supabase.from('perfiles').upsert([{ usuarios: usuarioId, fichas: FICHAS_INICIALES }]);
        }

        return res.json({ 
            exito: true, 
            mensaje: 'Partida iniciada por 0 fichas (Modo gratuito)',
            costo: 0 
        });
    } catch (err) {
        console.error("Error en /jugar-gratis:", err);
        res.status(500).json({ error: err.message });
    }
};

app.post('/jugar-gratis', jugarGratisHandler);
app.post('/api/jugar-gratis', jugarGratisHandler);

const crearPreferenciaHandler = async (req, res) => {
    try {
        const cantidad = Number(req.body.cantidad || req.body.fichas || 500);
        const PRECIO_POR_FICHA = 1; 
        const precioTotal = cantidad * PRECIO_POR_FICHA;
        const usuarioId = req.body.usuarioId || req.body.user || 'demo_user';

        const preference = new Preference(client);

        const resultado = await preference.create({
            body: {
                items: [
                    {
                        title: `${cantidad} Ficha(s) de Truco Argentino`,
                        quantity: 1,
                        unit_price: precioTotal,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `https://trucoargentino.site/?status=approved&cantidad=${cantidad}`,
                    failure: 'https://trucoargentino.site/?status=failure',
                    pending: 'https://trucoargentino.site/?status=pending'
                },
                auto_return: 'approved',
                external_reference: String(usuarioId)
            }
        });

        res.json({ init_point: resultado.init_point });

    } catch (error) {
        console.error('Error al crear preferencia de Mercado Pago:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};

app.post('/crear-preferencia', crearPreferenciaHandler);
app.post('/api/crear-preferencia', crearPreferenciaHandler);
app.post('/crear-preferencia-mp', crearPreferenciaHandler);
app.post('/api/crear-preferencia-mp', crearPreferenciaHandler);

// WEBHOOK DE MERCADO PAGO
const webhookHandler = async (req, res) => {
    try {
        const body = req.body;
        let paymentId = null;
        if (body.type === 'payment' && body.data && body.data.id) {
            paymentId = body.data.id;
        } else if (body.id && body.topic === 'payment') {
            paymentId = body.id;
        } else if (req.query && req.query['data.id']) {
            paymentId = req.query['data.id'];
        }

        if (paymentId) {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: paymentId });

            if (paymentData.status === 'approved') {
                const usuarioId = paymentData.external_reference;
                
                let fichasCompradas = 0;
                if (paymentData.additional_info && paymentData.additional_info.items && paymentData.additional_info.items.length > 0) {
                    const title = paymentData.additional_info.items[0].title;
                    const match = title.match(/(\d+)/);
                    if (match) fichasCompradas = Number(match[1]);
                }
                
                if (!fichasCompradas || fichasCompradas <= 0) {
                    const montoPagado = Number(paymentData.transaction_amount || 0);
                    fichasCompradas = montoPagado > 0 ? montoPagado : 500;
                }

                if (usuarioId && usuarioId !== 'demo_user' && fichasCompradas > 0) {
                    const { data: userData } = await supabase
                        .from('perfiles')
                        .select('fichas')
                        .eq('usuarios', usuarioId)
                        .single();

                    let saldoActual = userData ? (userData.fichas !== undefined ? userData.fichas : FICHAS_INICIALES) : FICHAS_INICIALES;
                    const nuevoSaldo = saldoActual + fichasCompradas;

                    const { error: updateError } = await supabase
                        .from('perfiles')
                        .upsert([{ usuarios: usuarioId, fichas: nuevoSaldo }]);

                    if (updateError) {
                        console.error("Error al actualizar fichas en Supabase:", updateError);
                    } else {
                        console.log(`¡Éxito! Se acreditaron ${fichasCompradas} fichas al usuario ${usuarioId}. Nuevo saldo: ${nuevoSaldo}`);
                    }
                }
            }
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Error procesando webhook de MP:', error);
        return res.status(200).send('OK');
    }
};

app.post('/webhook', webhookHandler);
app.post('/api/webhook', webhookHandler);

app.get('/webhook', (req, res) => {
    res.status(200).send('Endpoint de Webhook activo y operativo');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Truco corriendo en el puerto ${PORT}`);
});