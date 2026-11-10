// js/game.js
const SUPABASE_URL = 'https://olvieohhsybycmyojdpo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sBg5zRa3r3FS1pJGC5IwNg_Ca4Gy5An';
const API_URL = 'https://truco-brackend.onrender.com';

let usuarioId = null;
let nombreUsuario = '';
let saldoFichasActual = 0;
let supabaseClient = null;
let salaId = null;
let soyJ1 = false;
let canal = null;
let canalLobby = null;
let apuestaSalaActual = 100;
let metaPuntosPartida = 30;

let temporizadorTurno = null;
let segundosRestantes = 15;
let temporizadorRepartir = null;
let cuentaRepartir = 5;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch(e) {}

let estadoJuego = {
    ptsJ1: 0,
    ptsJ2: 0,
    rondaActual: 1,
    manoJugador: 'J1',
    turnoActual: 'J1',
    nombreJ1: 'Jugador 1',
    nombreJ2: 'Jugador 2',
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
    ultimoCantoGlobal: null,
    envidoGanadorInfo: null,
    finMano: false,
    mensajeEstado: 'Esperando conexiones...'
};

window.onload = async () => {
    poblarSelectApuestas();
    const modalAuth = document.getElementById('modal-auth');

    if (!supabaseClient) {
        modalAuth.classList.remove('hidden');
        return;
    }

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            usuarioId = session.user.id;
            nombreUsuario = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
            modalAuth.classList.add('hidden');
            await cargarSaldoUsuario();
            await intentarReconexion();
        } else {
            modalAuth.classList.remove('hidden');
        }
    } catch (err) {
        modalAuth.classList.remove('hidden');
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            usuarioId = session.user.id;
            nombreUsuario = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
            modalAuth.classList.add('hidden');
            await cargarSaldoUsuario();
            await intentarReconexion();
        } else {
            modalAuth.classList.remove('hidden');
        }
    });
};

async function intentarReconexion() {
    const salaGuardada = localStorage.getItem('truco_salaId');
    const esJ1Guardado = localStorage.getItem('truco_soyJ1');

    if (salaGuardada && supabaseClient) {
        const { data: salaBD } = await supabaseClient
            .from('salas')
            .select('*')
            .eq('id', salaGuardada)
            .maybeSingle();

        if (salaBD && salaBD.estado) {
            try {
                const paquete = typeof salaBD.estado === 'string' ? JSON.parse(salaBD.estado) : salaBD.estado;
                salaId = salaBD.id;
                soyJ1 = (esJ1Guardado === 'true');
                apuestaSalaActual = salaBD.apuesta || 100;
                metaPuntosPartida = salaBD.meta || 30;

                escucharCanalRealtime();

                const esEsperando = (typeof salaBD.estado === 'string') ? salaBD.estado.includes('ESPERANDO_J2') : paquete.tipo === 'ESPERANDO_J2';

                if (esEsperando) {
                    document.getElementById('pantalla-inicio').classList.add('hidden');
                    document.getElementById('menu-salas').classList.remove('hidden');
                    document.getElementById('menu-salas').classList.add('flex');
                    document.getElementById('esperando-rival').classList.remove('hidden');
                    document.getElementById('esperando-sala-info').innerText = `Mesa de ${nombreUsuario} · ${metaPuntosPartida} pts · Apuesta $${apuestaSalaActual.toLocaleString('es-AR')}`;
                } else {
                    document.getElementById('pantalla-inicio').classList.add('hidden');
                    document.getElementById('menu-salas').classList.add('hidden');
                    document.getElementById('panel-juego').classList.remove('hidden');
                    document.getElementById('panel-juego').classList.add('flex');

                    if (paquete.data) {
                        estadoJuego = paquete.data;
                        actualizarInterfaz();
                    }
                }
            } catch(e) {
                localStorage.removeItem('truco_salaId');
                localStorage.removeItem('truco_soyJ1');
            }
        } else {
            localStorage.removeItem('truco_salaId');
            localStorage.removeItem('truco_soyJ1');
        }
    }
}

function poblarSelectApuestas() {
    const select = document.getElementById('select-apuesta');
    if (!select) return;
    select.innerHTML = '';
    
    const optGratis = document.createElement('option');
    optGratis.value = 0;
    optGratis.innerText = '$0 (Práctica Gratis)';
    select.appendChild(optGratis);

    for (let v = 100; v <= 2000; v += 100) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.innerText = `$${v.toLocaleString('es-AR')} ARS`;
        select.appendChild(opt);
    }

    for (let v = 3000; v <= 10000; v += 1000) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.innerText = `$${v.toLocaleString('es-AR')} ARS`;
        select.appendChild(opt);
    }

    for (let v = 15000; v <= 100000; v += 5000) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.innerText = `$${v.toLocaleString('es-AR')} ARS`;
        select.appendChild(opt);
    }
}

async function cargarSaldoUsuario() {
    if (!usuarioId) {
        document.getElementById('saldoFichas').innerText = saldoFichasActual.toLocaleString('es-AR');
        return;
    }
    try {
        let { data: perfil } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('usuarios', usuarioId)
            .maybeSingle();

        if (!perfil) {
            const { data: nuevoPerfil } = await supabaseClient
                .from('perfiles')
                .insert([{ usuarios: usuarioId, nombre: nombreUsuario || 'Jugador', fichas: 0 }])
                .select()
                .single();
            perfil = nuevoPerfil;
        }

        if (perfil) {
            saldoFichasActual = (perfil.fichas !== undefined && perfil.fichas !== null) ? perfil.fichas : 0;
            nombreUsuario = perfil.nombre || nombreUsuario || 'Jugador';
        } else {
            saldoFichasActual = 0;
        }

        const spanSaldo = document.getElementById('saldoFichas');
        if (spanSaldo) spanSaldo.innerText = saldoFichasActual.toLocaleString('es-AR');

        const inputName = document.getElementById('user-name');
        if (inputName) inputName.value = nombreUsuario;

        const displayNombre = document.getElementById('display-nombre-usuario');
        if (displayNombre) displayNombre.innerText = nombreUsuario;

    } catch (err) {
        saldoFichasActual = 0;
        document.getElementById('saldoFichas').innerText = saldoFichasActual.toLocaleString('es-AR');
    }
}

async function actualizarSaldoBD(nuevoSaldo) {
    saldoFichasActual = Math.max(0, nuevoSaldo);
    
    const spanSaldo = document.getElementById('saldoFichas');
    if (spanSaldo) spanSaldo.innerText = saldoFichasActual.toLocaleString('es-AR');

    if (supabaseClient && usuarioId) {
        try {
            await supabaseClient.from('perfiles').update({ fichas: saldoFichasActual }).eq('usuarios', usuarioId);
        } catch (e) {}
    }
}

async function iniciarSesionGoogle() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: { access_type: 'offline', prompt: 'consent' }
        }
    });
    if (error) mostrarAlertaAuth(error.message, true);
}

async function procesarAuth(e) {
    e.preventDefault();
    const nombreIngresado = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;

    if (!nombreIngresado) {
        mostrarAlertaAuth("El nombre de usuario es obligatorio.", true);
        return;
    }

    nombreUsuario = nombreIngresado;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        const { data: dataReg, error: errReg } = await supabaseClient.auth.signUp({ email, password });
        if (errReg) {
            mostrarAlertaAuth(errReg.message, true);
        } else {
            if (dataReg.user) {
                usuarioId = dataReg.user.id;
                await guardarNombreEnBD(nombreUsuario);
            }
            mostrarAlertaAuth("¡Cuenta creada con éxito!", false);
            setTimeout(async () => {
                document.getElementById('modal-auth').classList.add('hidden');
                await cargarSaldoUsuario();
            }, 800);
        }
    } else {
        usuarioId = data.user.id;
        await guardarNombreEnBD(nombreUsuario);
        mostrarAlertaAuth("¡Bienvenido!", false);
        setTimeout(async () => {
            document.getElementById('modal-auth').classList.add('hidden');
            await cargarSaldoUsuario();
        }, 800);
    }
}

async function guardarNombreEnBD(nombre) {
    if (!supabaseClient || !usuarioId) return;
    try {
        let { data: perfil } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('usuarios', usuarioId)
            .maybeSingle();

        if (!perfil) {
            await supabaseClient.from('perfiles').insert([
                { usuarios: usuarioId, nombre: nombre, fichas: 0 }
            ]);
        } else {
            await supabaseClient.from('perfiles').update({ nombre: nombre }).eq('usuarios', usuarioId);
        }
    } catch (e) {}
}

function abrirModalCambiarNombre() {
    document.getElementById('input-nuevo-nombre').value = nombreUsuario;
    toggleModal('modal-cambiar-nombre');
}

async function guardarNuevoNombreLobby() {
    const nuevoNom = document.getElementById('input-nuevo-nombre').value.trim();
    if (!nuevoNom) {
        alert("El nombre de usuario es obligatorio.");
        return;
    }
    nombreUsuario = nuevoNom;
    await guardarNombreEnBD(nombreUsuario);
    document.getElementById('display-nombre-usuario').innerText = nombreUsuario;
    toggleModal('modal-cambiar-nombre');
}

async function cerrarSesion() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    localStorage.clear();
    location.reload();
}

function mostrarAlertaAuth(texto, esError) {
    const alertDiv = document.getElementById('auth-alert');
    alertDiv.innerText = texto;
    alertDiv.className = esError 
        ? "text-xs p-3 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20" 
        : "text-xs p-3 rounded-xl text-center bg-amber-500/10 text-amber-400 border border-amber-500/20";
    alertDiv.classList.remove('hidden');
}

function toggleModal(id) {
    document.getElementById(id).classList.toggle('hidden');
}

function mostrarLobbySalas() {
    document.getElementById('pantalla-inicio').classList.add('hidden');
    document.getElementById('menu-salas').classList.remove('hidden');
    document.getElementById('menu-salas').classList.add('flex');
    document.getElementById('display-nombre-usuario').innerText = nombreUsuario;
    cargarLobbySalas();
    escucharLobbyRealtime();
}

function volverAInicio() {
    document.getElementById('menu-salas').classList.add('hidden');
    document.getElementById('menu-salas').classList.remove('flex');
    document.getElementById('pantalla-inicio').classList.remove('hidden');
    if (canalLobby) supabaseClient.removeChannel(canalLobby);
}

async function cargarLobbySalas() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('salas')
        .select('*');

    const contenedor = document.getElementById('lista-salas');
    
    if (error || !data) {
        contenedor.innerHTML = `<div class="text-xs text-slate-400 italic text-center py-4">No hay salas abiertas. ¡Creá una para empezar!</div>`;
        return;
    }

    const salasFiltradas = data.filter(s => {
        try {
            const paquete = typeof s.estado === 'string' ? JSON.parse(s.estado) : s.estado;
            return paquete && paquete.tipo === 'ESPERANDO_J2';
        } catch(e) {
            return s.estado && String(s.estado).includes('ESPERANDO_J2');
        }
    });

    if (salasFiltradas.length === 0) {
        contenedor.innerHTML = `<div class="text-xs text-slate-400 italic text-center py-4">No hay salas abiertas. ¡Creá una para empezar!</div>`;
        return;
    }

    contenedor.innerHTML = '';
    for (const s of salasFiltradas) {
        const esMiMesa = (s.jugador1 === usuarioId) || (soyJ1 && String(s.id) === String(salaId));
        
        let nombreCreador = 'Mesa';
        try {
            const paquete = typeof s.estado === 'string' ? JSON.parse(s.estado) : s.estado;
            if (paquete && paquete.data && paquete.data.nombreJ1) {
                nombreCreador = paquete.data.nombreJ1;
            }
        } catch(e) {}

        if (esMiMesa) nombreCreador = nombreUsuario;

        const item = document.createElement('div');
        item.className = "card-trucox p-3.5 rounded-2xl flex justify-between items-center transition shadow-lg border border-slate-700/80";
        
        const idSalaParam = typeof s.id === 'string' ? `'${s.id}'` : s.id;

        item.innerHTML = `
            <div class="text-left space-y-1">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">M</span>
                    <span class="text-xs font-black text-slate-200">Mesa de ${nombreCreador}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">🟢 LIBRE</span>
                    <span class="text-[10px] text-slate-400 font-bold">1v1 · ${s.meta || 30}pts</span>
                </div>
            </div>
            <div class="text-right space-y-1">
                <div class="text-sm font-black text-amber-400">$${(s.apuesta || 0).toLocaleString('es-AR')}</div>
                ${esMiMesa ? 
                    `<span class="text-[10px] font-bold text-amber-400/80 bg-amber-400/10 border border-amber-400/30 px-2 py-1 rounded-xl">Tu Mesa</span>` :
                    `<button onclick="unirseADeterminadaSala(${idSalaParam}, ${s.apuesta || 0}, ${s.meta || 30})" class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs py-1.5 px-4 rounded-xl transition shadow-md uppercase cursor-pointer">UNIRSE</button>`
                }
            </div>
        `;
        contenedor.appendChild(item);
    }
}

function escucharLobbyRealtime() {
    if (!supabaseClient) return;
    canalLobby = supabaseClient
        .channel('public:lobby_salas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salas' }, () => {
            cargarLobbySalas();
        })
        .subscribe();
}

async function crearSala() {
    if (!supabaseClient) return;
    const montoApuesta = Number(document.getElementById('select-apuesta').value);
    metaPuntosPartida = Number(document.getElementById('select-puntos-partido').value);

    if (montoApuesta > 0 && saldoFichasActual < montoApuesta) {
        alert(`Saldo insuficiente. Necesitás $${montoApuesta.toLocaleString('es-AR')} para esta mesa.`);
        return;
    }

    estadoJuego.nombreJ1 = nombreUsuario;

    const payloadInicial = {
        tipo: 'ESPERANDO_J2',
        data: { ...estadoJuego, nombreJ1: nombreUsuario },
        timestamp: Date.now()
    };

    const insertObj = {
        estado: JSON.stringify(payloadInicial),
        jugador1: String(usuarioId || 'J1_CONECTADO'),
        apuesta: Number(montoApuesta),
        meta: Number(metaPuntosPartida)
    };

    const { data, error } = await supabaseClient
        .from('salas')
        .insert([insertObj])
        .select().single();

    if (error) { 
        alert("Error al crear mesa: " + error.message); 
        return; 
    }

    salaId = data.id;
    soyJ1 = true;
    apuestaSalaActual = montoApuesta;

    localStorage.setItem('truco_salaId', salaId);
    localStorage.setItem('truco_soyJ1', 'true');

    document.getElementById('esperando-rival').classList.remove('hidden');
    document.getElementById('esperando-sala-info').innerText = `Mesa de ${nombreUsuario} · ${metaPuntosPartida} pts · Apuesta $${apuestaSalaActual.toLocaleString('es-AR')}`;
    cargarLobbySalas();
    escucharCanalRealtime();
}

async function cancelarCreacionSala() {
    if (salaId && supabaseClient) {
        await supabaseClient.from('salas').delete().eq('id', salaId);
    }
    limpiarEstadoJuego();
    document.getElementById('esperando-rival').classList.add('hidden');
    cargarLobbySalas();
}

async function unirseADeterminadaSala(idElegida, montoApuesta, metaSala) {
    if (montoApuesta > 0 && saldoFichasActual < montoApuesta) {
        alert(`Saldo insuficiente. Necesitás $${montoApuesta.toLocaleString('es-AR')} para esta mesa.`);
        return;
    }

    salaId = idElegida;
    soyJ1 = false;
    apuestaSalaActual = montoApuesta;
    metaPuntosPartida = metaSala;

    localStorage.setItem('truco_salaId', salaId);
    localStorage.setItem('truco_soyJ1', 'false');

    document.getElementById('esperando-rival').classList.add('hidden');
    escucharCanalRealtime();
    
    estadoJuego.nombreJ2 = nombreUsuario;
    await enviarAccionSupabase('J2_UNIDO', estadoJuego);
}

async function repartirNuevaMano(manoEspecifica) {
    if (!soyJ1) return;
    detenerTemporizadorRepartir();

    const mazoMezclado = [...MAZO].sort(() => Math.random() - 0.5);
    const proximaMano = manoEspecifica || (estadoJuego.manoJugador === 'J1' ? 'J2' : 'J1');

    const cJ1 = [mazoMezclado[0], mazoMezclado[1], mazoMezclado[2]];
    const cJ2 = [mazoMezclado[3], mazoMezclado[4], mazoMezclado[5]];

    estadoJuego.cartasJ1 = [...cJ1];
    estadoJuego.cartasJ2 = [...cJ2];
    estadoJuego.cartasInicialesJ1 = [...cJ1];
    estadoJuego.cartasInicialesJ2 = [...cJ2];
    
    estadoJuego.rondaActual = 1;
    estadoJuego.manoJugador = proximaMano;
    estadoJuego.turnoActual = proximaMano;
    estadoJuego.mesaR1 = { J1: null, J2: null };
    estadoJuego.mesaR2 = { J1: null, J2: null };
    estadoJuego.mesaR3 = { J1: null, J2: null };
    estadoJuego.nivelTruco = 1;
    estadoJuego.puntosTrucoAceptado = 1;
    estadoJuego.ultimoQueCantoTruco = null;
    estadoJuego.envidoCantado = false;
    estadoJuego.puntosEnvidoEnJuego = 0;
    estadoJuego.puntosEnvidoRechazo = 1;
    estadoJuego.historialEnvido = [];
    estadoJuego.cantosPendientes = null;
    estadoJuego.ultimoCantoGlobal = null;
    estadoJuego.envidoGanadorInfo = null;
    estadoJuego.finMano = false;
    estadoJuego.mensajeEstado = `¡Nueva mano repartida!`;

    await enviarAccionSupabase('NUEVA_MANO', estadoJuego);
}

async function enviarAccionSupabase(tipo, payloadData) {
    payloadData.nombreJ1 = soyJ1 ? nombreUsuario : (payloadData.nombreJ1 || nombreUsuario);
    payloadData.nombreJ2 = !soyJ1 ? nombreUsuario : (payloadData.nombreJ2 || payloadData.nombreJ2 || 'Rival');
    
    const dataString = JSON.stringify({ tipo, data: payloadData, timestamp: Date.now() });
    await supabaseClient.from('salas').update({ estado: dataString }).eq('id', salaId);
}

function escucharCanalRealtime() {
    if (canal) supabaseClient.removeChannel(canal);

    canal = supabaseClient
        .channel('public:salas_' + salaId)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salas', filter: 'id=eq.' + salaId },
            payload => {
                try {
                    const raw = payload.new.estado;
                    if (!raw) return;
                    const paquete = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    procesarAccionRed(paquete.tipo, paquete.data);
                } catch(e) {}
            }
        )
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'salas', filter: 'id=eq.' + salaId }, () => {
            procesarAbandonoRival();
        })
        .subscribe();
}

function procesarAccionRed(tipo, data) {
    if (tipo === 'ABANDONO') {
        procesarAbandonoRival();
        return;
    }

    if (tipo === 'SOLICITAR_REPARTIR' && soyJ1) {
        repartirNuevaMano();
        return;
    }

    if (tipo === 'J2_UNIDO' && soyJ1) {
        document.getElementById('esperando-rival').classList.add('hidden');
        document.getElementById('menu-salas').classList.add('hidden');
        document.getElementById('menu-salas').classList.remove('flex');
        document.getElementById('pantalla-inicio').classList.add('hidden');
        document.getElementById('panel-juego').classList.remove('hidden');
        document.getElementById('panel-juego').classList.add('flex');
        
        estadoJuego = data;
        estadoJuego.nombreJ1 = nombreUsuario;
        repartirNuevaMano('J1');
        return;
    }

    if (tipo === 'NUEVA_MANO' || tipo === 'ACTUALIZAR_ESTADO') {
        estadoJuego = data;
        document.getElementById('esperando-rival').classList.add('hidden');
        document.getElementById('menu-salas').classList.add('hidden');
        document.getElementById('menu-salas').classList.remove('flex');
        document.getElementById('pantalla-inicio').classList.add('hidden');
        document.getElementById('panel-juego').classList.remove('hidden');
        document.getElementById('panel-juego').classList.add('flex');
        actualizarInterfaz();
    }
}

function procesarAbandonoRival() {
    if (!salaId) return;
    detenerTemporizador();
    detenerTemporizadorRepartir();
    
    if (apuestaSalaActual > 0) {
        const pozoTotal = apuestaSalaActual * 2;
        const gananciaNeta = pozoTotal * 0.98;
        actualizarSaldoBD(saldoFichasActual + (gananciaNeta - apuestaSalaActual));
    }

    alert("¡Tu rival abandonó la mesa!");
    limpiarEstadoJuego();
    document.getElementById('panel-juego').classList.add('hidden');
    document.getElementById('panel-juego').classList.remove('flex');
    document.getElementById('pantalla-inicio').classList.remove('hidden');
}

function renderizarCartaMesaHTML(cartaObj, esGanadora = false) {
    if (!cartaObj) return '';
    const claseGanadora = esGanadora ? 'carta-ganadora' : '';
    const coronaBadge = esGanadora ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-lg z-30">🏆</span>` : '';
    return `${coronaBadge}<img src="${cartaObj.img}" alt="${cartaObj.txt}" onerror="this.src='casrtas/IMG_7081.JPG'" class="w-full h-full object-cover rounded-lg bg-transparent shadow-2xl ${claseGanadora}" />`;
}

function actualizarInterfaz() {
    const miRol = soyJ1 ? 'J1' : 'J2';
    const rivalRol = soyJ1 ? 'J2' : 'J1';

    const misPts = soyJ1 ? estadoJuego.ptsJ1 : estadoJuego.ptsJ2;
    const rivalPts = soyJ1 ? estadoJuego.ptsJ2 : estadoJuego.ptsJ1;

    const miNombreReal = soyJ1 ? (estadoJuego.nombreJ1 || nombreUsuario) : (estadoJuego.nombreJ2 || nombreUsuario);
    const rivalNombreReal = soyJ1 ? (estadoJuego.nombreJ2 || 'Rival') : (estadoJuego.nombreJ1 || 'Rival');

    document.getElementById('pts-yo').innerText = misPts;
    document.getElementById('pts-el').innerText = rivalPts;
    document.getElementById('nombre-yo-txt').innerText = miNombreReal;
    document.getElementById('nombre-el-txt').innerText = rivalNombreReal;
    document.getElementById('nombre-rival-perfil').innerText = rivalNombreReal;

    if (misPts >= metaPuntosPartida || rivalPts >= metaPuntosPartida) {
        evaluarFinDePartida(misPts >= metaPuntosPartida);
        return;
    }

    const miTurno = estadoJuego.turnoActual === miRol;
    
    document.getElementById('turno-info').innerText = miTurno ? '¡Tu turno!' : 'Esperando a tu rival...';

    if (miTurno && !estadoJuego.cantosPendientes && !estadoJuego.finMano) {
        iniciarTemporizador();
    } else {
        detenerTemporizador();
    }

    const gR1 = (estadoJuego.mesaR1.J1 && estadoJuego.mesaR1.J2) ? (estadoJuego.mesaR1.J1.poder > estadoJuego.mesaR1.J2.poder ? 'J1' : (estadoJuego.mesaR1.J2.poder > estadoJuego.mesaR1.J1.poder ? 'J2' : null)) : null;
    const gR2 = (estadoJuego.mesaR2.J1 && estadoJuego.mesaR2.J2) ? (estadoJuego.mesaR2.J1.poder > estadoJuego.mesaR2.J2.poder ? 'J1' : (estadoJuego.mesaR2.J2.poder > estadoJuego.mesaR2.J1.poder ? 'J2' : null)) : null;
    const gR3 = (estadoJuego.mesaR3.J1 && estadoJuego.mesaR3.J2) ? (estadoJuego.mesaR3.J1.poder > estadoJuego.mesaR3.J2.poder ? 'J1' : (estadoJuego.mesaR3.J2.poder > estadoJuego.mesaR3.J1.poder ? 'J2' : null)) : null;

    document.getElementById('r1-yo').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR1[miRol], gR1 === miRol);
    document.getElementById('r1-el').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR1[rivalRol], gR1 === rivalRol);
    document.getElementById('r2-yo').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR2[miRol], gR2 === miRol);
    document.getElementById('r2-el').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR2[rivalRol], gR2 === rivalRol);
    document.getElementById('r3-yo').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR3[miRol], gR3 === miRol);
    document.getElementById('r3-el').innerHTML = renderizarCartaMesaHTML(estadoJuego.mesaR3[rivalRol], gR3 === rivalRol);

    const misCartasActuales = soyJ1 ? estadoJuego.cartasJ1 : estadoJuego.cartasJ2;
    const contenedor = document.getElementById('contenedor-mano');
    contenedor.innerHTML = '';

    misCartasActuales.forEach((carta) => {
        const btn = document.createElement('button');
        btn.className = `carta-mano-blyts flex items-center justify-center p-0 cursor-pointer overflow-hidden ${miTurno && !estadoJuego.cantosPendientes && !estadoJuego.finMano ? 'opacity-100' : 'opacity-75 cursor-not-allowed'}`;
        btn.disabled = !miTurno || estadoJuego.cantosPendientes !== null || estadoJuego.finMano;
        btn.onclick = () => tirarcarta(carta);
        btn.innerHTML = `<img src="${carta.img}" alt="${carta.txt}" onerror="this.src='casrtas/IMG_7081.JPG'" class="w-full h-full object-cover rounded-xl bg-transparent" />`;
        contenedor.appendChild(btn);
    });

    if (estadoJuego.ultimoCantoGlobal) {
        const { jugador, texto } = estadoJuego.ultimoCantoGlobal;
        const esYo = jugador === miRol;
        mostrarGloboDialogo(esYo, texto);
    }

    const panelEnvidoGanador = document.getElementById('panel-envido-ganador');
    if (estadoJuego.finMano && estadoJuego.envidoGanadorInfo) {
        panelEnvidoGanador.classList.remove('hidden');
        const esYoElGanador = estadoJuego.envidoGanadorInfo.ganador === miRol;
        document.getElementById('txt-envido-ganador-titulo').innerText = `Envido: Cartas de ${esYoElGanador ? miNombreReal : rivalNombreReal} (${estadoJuego.envidoGanadorInfo.puntos} pts)`;
        document.getElementById('envido-cartas-ganador').innerHTML = (estadoJuego.envidoGanadorInfo.cartas || []).map(c => `<img src="${c.img}" class="h-full rounded shadow" />`).join('');
    } else {
        panelEnvidoGanador.classList.add('hidden');
    }

    const panelRepartir = document.getElementById('panel-repartir');
    const bloqueBtnRepartir = document.getElementById('bloque-btn-repartir');
    const bloqueEsperaRepartir = document.getElementById('bloque-espera-repartir');

    if (estadoJuego.finMano) {
        panelRepartir.classList.remove('hidden');
        document.getElementById('txt-fin-mano').innerText = estadoJuego.mensajeEstado;

        const proximaMano = estadoJuego.manoJugador === 'J1' ? 'J2' : 'J1';
        const esMiTurnoDeRepartir = proximaMano === miRol;

        if (esMiTurnoDeRepartir) {
            bloqueBtnRepartir.classList.remove('hidden');
            bloqueEsperaRepartir.classList.add('hidden');
        } else {
            bloqueBtnRepartir.classList.add('hidden');
            bloqueEsperaRepartir.classList.remove('hidden');
        }

        iniciarTemporizadorRepartir();
    } else {
        panelRepartir.classList.add('hidden');
        detenerTemporizadorRepartir();
    }

    const btnTruco = document.getElementById('btn-truco');
    if (!miTurno || estadoJuego.ultimoQueCantoTruco === miRol || estadoJuego.nivelTruco >= 4 || estadoJuego.finMano) {
        btnTruco.classList.add('hidden');
    } else {
        btnTruco.classList.remove('hidden');
        if (estadoJuego.nivelTruco === 1) btnTruco.innerText = 'Truco!';
        else if (estadoJuego.nivelTruco === 2) btnTruco.innerText = 'Quiero re truco';
        else if (estadoJuego.nivelTruco === 3) btnTruco.innerText = 'Vale Cuatro!';
    }

    const bloqueEnvidos = document.getElementById('bloque-envidos');
    if (estadoJuego.rondaActual === 1 && !estadoJuego.envidoCantado && miTurno && !estadoJuego.finMano) {
        bloqueEnvidos.classList.remove('hidden');
    } else {
        bloqueEnvidos.classList.add('hidden');
    }

    if (estadoJuego.cantosPendientes) {
        const paraMi = estadoJuego.cantosPendientes.para === miRol;
        if (paraMi) {
            document.getElementById('texto-canto-rival').innerText = `¡Te cantaron ${estadoJuego.cantosPendientes.tipo}!`;
            document.getElementById('panel-respuesta').classList.remove('hidden');
            
            const recantoEnvido = document.getElementById('botones-recanto-envido');
            const recantoTruco = document.getElementById('btn-recantar-truco');

            if (estadoJuego.cantosPendientes.tipo.includes('Envido') || estadoJuego.cantosPendientes.tipo.includes('envido')) {
                recantoEnvido.classList.remove('hidden');
                recantoTruco.classList.add('hidden');
            } else if (estadoJuego.cantosPendientes.tipo.includes('Truco')) {
                recantoTruco.classList.remove('hidden');
                recantoEnvido.classList.add('hidden');
                recantoTruco.innerText = estadoJuego.cantosPendientes.tipo === 'Truco!' ? 'Quiero re truco' : 'Vale Cuatro!';
            } else {
                recantoEnvido.classList.add('hidden');
                recantoTruco.classList.add('hidden');
            }
        } else {
            document.getElementById('panel-respuesta').classList.add('hidden');
            document.getElementById('estado-mensaje').innerText = `Cantaste ${estadoJuego.cantosPendientes.tipo}. Esperando respuesta...`;
        }
    } else {
        document.getElementById('panel-respuesta').classList.add('hidden');
        document.getElementById('estado-mensaje').innerText = estadoJuego.mensajeEstado || (miTurno ? '¡Es tu turno!' : 'Esperando a tu rival...');
    }
}

function iniciarTemporizadorRepartir() {
    if (temporizadorRepartir) return;
    cuentaRepartir = 5;
    
    const updateCuentas = () => {
        const elCuenta = document.getElementById('cuenta-repartir');
        const elCuentaEspera = document.getElementById('cuenta-repartir-espera');
        if (elCuenta) elCuenta.innerText = cuentaRepartir;
        if (elCuentaEspera) elCuentaEspera.innerText = cuentaRepartir;
    };

    updateCuentas();

    temporizadorRepartir = setInterval(() => {
        cuentaRepartir--;
        updateCuentas();

        if (cuentaRepartir <= 0) {
            detenerTemporizadorRepartir();
            const proximaMano = estadoJuego.manoJugador === 'J1' ? 'J2' : 'J1';
            const miRol = soyJ1 ? 'J1' : 'J2';
            if (proximaMano === miRol) {
                solicitarNuevaMano();
            }
        }
    }, 1000);
}

function detenerTemporizadorRepartir() {
    if (temporizadorRepartir) {
        clearInterval(temporizadorRepartir);
        temporizadorRepartir = null;
    }
}

function solicitarNuevaMano() {
    detenerTemporizadorRepartir();
    if (soyJ1) {
        repartirNuevaMano();
    } else {
        enviarAccionSupabase('SOLICITAR_REPARTIR', {});
    }
}

function iniciarTemporizador() {
    if (temporizadorTurno) return;
    segundosRestantes = 15;
    document.getElementById('temporizador-turno').innerText = segundosRestantes;
    
    temporizadorTurno = setInterval(() => {
        segundosRestantes--;
        const elem = document.getElementById('temporizador-turno');
        if (elem) elem.innerText = segundosRestantes;

        if (segundosRestantes <= 0) {
            detenerTemporizador();
            cantar('Me voy al mazo');
        }
    }, 1000);
}

function detenerTemporizador() {
    if (temporizadorTurno) {
        clearInterval(temporizadorTurno);
        temporizadorTurno = null;
    }
    const elem = document.getElementById('temporizador-turno');
    if (elem) elem.innerText = '15';
}

function mostrarGloboDialogo(esYo, texto) {
    const containerId = esYo ? 'globo-yo-container' : 'globo-rival-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="globo-dialogo">${texto}</div>`;
    setTimeout(() => { 
        if (container) container.innerHTML = ''; 
    }, 3000);
}

function evaluarFinDePartida(ganeYo) {
    detenerTemporizador();
    detenerTemporizadorRepartir();

    if (apuestaSalaActual > 0) {
        const pozoTotal = apuestaSalaActual * 2;
        const gananciaNetoPura = Math.floor(pozoTotal * 0.98);

        if (ganeYo) {
            actualizarSaldoBD(saldoFichasActual + (gananciaNetoPura - apuestaSalaActual));
            alert("¡Ganaste la partida!");
        } else {
            actualizarSaldoBD(saldoFichasActual - apuestaSalaActual);
            alert("Perdiste la partida");
        }
    }
    limpiarEstadoJuego();
    document.getElementById('panel-juego').classList.add('hidden');
    document.getElementById('panel-juego').classList.remove('flex');
    document.getElementById('pantalla-inicio').classList.remove('hidden');
}

function pedirConfirmacionAbandono() {
    document.getElementById('modal-confirmar-abandono').classList.remove('hidden');
}

function cerrarModalAbandono() {
    document.getElementById('modal-confirmar-abandono').classList.add('hidden');
}

async function confirmarAbandonoPartida() {
    cerrarModalAbandono();
    detenerTemporizador();
    detenerTemporizadorRepartir();

    if (apuestaSalaActual > 0) {
        await actualizarSaldoBD(saldoFichasActual - apuestaSalaActual);
    }

    if (salaId) {
        await enviarAccionSupabase('ABANDONO', {});
        await supabaseClient.from('salas').delete().eq('id', salaId);
    }

    limpiarEstadoJuego();
    document.getElementById('panel-juego').classList.add('hidden');
    document.getElementById('panel-juego').classList.remove('flex');
    document.getElementById('menu-salas').classList.add('hidden');
    document.getElementById('menu-salas').classList.remove('flex');
    document.getElementById('pantalla-inicio').classList.remove('hidden');
    document.getElementById('esperando-rival').classList.add('hidden');
}

async function tirarcarta(carta) {
    const miRol = soyJ1 ? 'J1' : 'J2';
    if (estadoJuego.turnoActual !== miRol || estadoJuego.cantosPendientes || estadoJuego.finMano) return;

    detenerTemporizador();
    
    if (soyJ1) estadoJuego.cartasJ1 = estadoJuego.cartasJ1.filter(c => c.id !== carta.id);
    else estadoJuego.cartasJ2 = estadoJuego.cartasJ2.filter(c => c.id !== carta.id);

    if (estadoJuego.rondaActual === 1) estadoJuego.mesaR1[miRol] = carta;
    else if (estadoJuego.rondaActual === 2) estadoJuego.mesaR2[miRol] = carta;
    else if (estadoJuego.rondaActual === 3) estadoJuego.mesaR3[miRol] = carta;

    const rival = soyJ1 ? 'J2' : 'J1';
    const mesaRonda = estadoJuego[`mesaR${estadoJuego.rondaActual}`];

    if (!mesaRonda[rival]) {
        estadoJuego.turnoActual = rival;
        await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
    } else {
        evaluarFinDeRonda();
    }
}

function evaluarFinDeRonda() {
    const c1 = estadoJuego[`mesaR${estadoJuego.rondaActual}`].J1;
    const c2 = estadoJuego[`mesaR${estadoJuego.rondaActual}`].J2;

    let ganadorRonda = null;
    if (c1.poder > c2.poder) ganadorRonda = 'J1';
    else if (c2.poder > c1.poder) ganadorRonda = 'J2';
    else ganadorRonda = 'PARDA';

    if (ganadorRonda !== 'PARDA') {
        estadoJuego.turnoActual = ganadorRonda;
    } else {
        estadoJuego.turnoActual = estadoJuego.manoJugador;
    }

    const g1 = obtenerGanadorRonda(1);
    const g2 = estadoJuego.rondaActual >= 2 ? obtenerGanadorRonda(2) : null;

    let ganadorMano = null;

    if (estadoJuego.rondaActual === 2) {
        if (g1 === 'J1' && g2 === 'J1') ganadorMano = 'J1';
        else if (g1 === 'J2' && g2 === 'J2') ganadorMano = 'J2';
        else if (g1 === 'J1' && g2 === 'PARDA') ganadorMano = 'J1';
        else if (g1 === 'J2' && g2 === 'PARDA') ganadorMano = 'J2';
        else if (g1 === 'PARDA' && g2 !== 'PARDA') ganadorMano = g2;
    } else if (estadoJuego.rondaActual === 3) {
        const g3 = obtenerGanadorRonda(3);
        if (g3 !== 'PARDA') ganadorMano = g3;
        else ganadorMano = g1 !== 'PARDA' ? g1 : estadoJuego.manoJugador;
    }

    if (ganadorMano) {
        const ptsAOtorgar = estadoJuego.puntosTrucoAceptado || 1;
        if (ganadorMano === 'J1') estadoJuego.ptsJ1 += ptsAOtorgar;
        else estadoJuego.ptsJ2 += ptsAOtorgar;

        const miNombreReal = soyJ1 ? estadoJuego.nombreJ1 : estadoJuego.nombreJ2;
        const rivalNombreReal = soyJ1 ? estadoJuego.nombreJ2 : estadoJuego.nombreJ1;
        const soyGanador = (soyJ1 && ganadorMano === 'J1') || (!soyJ1 && ganadorMano === 'J2');
        
        estadoJuego.mensajeEstado = `¡Ganó la mano ${soyGanador ? miNombreReal : rivalNombreReal}! (+${ptsAOtorgar} pts)`;
        estadoJuego.finMano = true;

        enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
    } else {
        estadoJuego.rondaActual += 1;
        enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
    }
}

function obtenerGanadorRonda(numRonda) {
    const m = estadoJuego[`mesaR${numRonda}`];
    if (!m.J1 || !m.J2) return null;
    if (m.J1.poder > m.J2.poder) return 'J1';
    if (m.J2.poder > m.J1.poder) return 'J2';
    return 'PARDA';
}

function cantarTrucoDinamico() {
    if (estadoJuego.nivelTruco === 1) cantar('Truco!');
    else if (estadoJuego.nivelTruco === 2) cantar('Quiero re truco');
    else if (estadoJuego.nivelTruco === 3) cantar('Vale Cuatro!');
}

function recantarTruco() {
    if (estadoJuego.cantosPendientes.tipo === 'Truco!') cantar('Quiero re truco');
    else if (estadoJuego.cantosPendientes.tipo === 'Quiero re truco') cantar('Vale Cuatro!');
}

function calcularValorFaltaEnvido() {
    const maxPts = Math.max(estadoJuego.ptsJ1, estadoJuego.ptsJ2);
    return Math.max(1, metaPuntosPartida - maxPts);
}

async function cantar(tipo) {
    const miRol = soyJ1 ? 'J1' : 'J2';
    if (estadoJuego.cantosPendientes && estadoJuego.cantosPendientes.para !== miRol) return;

    detenerTemporizador();
    const rival = soyJ1 ? 'J2' : 'J1';

    estadoJuego.ultimoCantoGlobal = { jugador: miRol, texto: tipo };

    if (tipo === 'Me voy al mazo') {
        const ptsNoQuiero = estadoJuego.puntosTrucoAceptado || 1;
        if (miRol === 'J1') estadoJuego.ptsJ2 += ptsNoQuiero;
        else estadoJuego.ptsJ1 += ptsNoQuiero;

        estadoJuego.mensajeEstado = `¡Me voy al mazo! Punto(s) para el rival.`;
        estadoJuego.finMano = true;
        
        await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
        return;
    }

    if (tipo === 'Envido' || tipo === 'Real envido' || tipo === 'Falta envido') {
        estadoJuego.historialEnvido.push(tipo);
        
        let ptsQuiero = 0;
        let ptsNoQuiero = 1;

        const cadena = estadoJuego.historialEnvido.join(' + ');

        if (cadena === 'Envido') { ptsQuiero = 2; ptsNoQuiero = 1; }
        else if (cadena === 'Real envido') { ptsQuiero = 3; ptsNoQuiero = 1; }
        else if (cadena === 'Envido + Envido') { ptsQuiero = 4; ptsNoQuiero = 2; }
        else if (cadena === 'Envido + Real envido') { ptsQuiero = 5; ptsNoQuiero = 2; }
        else if (cadena === 'Envido + Envido + Real envido') { ptsQuiero = 7; ptsNoQuiero = 4; }
        else if (tipo === 'Falta envido') {
            ptsQuiero = calcularValorFaltaEnvido();
            ptsNoQuiero = estadoJuego.puntosEnvidoEnJuego || 1;
        }

        estadoJuego.puntosEnvidoEnJuego = ptsQuiero;
        estadoJuego.puntosEnvidoRechazo = ptsNoQuiero;
    }

    estadoJuego.cantosPendientes = { tipo, de: miRol, para: rival };
    if (tipo.includes('Truco') || tipo.includes('re truco') || tipo.includes('Vale')) {
        estadoJuego.ultimoQueCantoTruco = miRol;
    }
    await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
}

async function responder(acepta) {
    const miRol = soyJ1 ? 'J1' : 'J2';
    if (!estadoJuego.cantosPendientes || estadoJuego.cantosPendientes.para !== miRol) return;

    const tipo = estadoJuego.cantosPendientes.tipo;
    const emisor = estadoJuego.cantosPendientes.de;

    estadoJuego.cantosPendientes = null;
    estadoJuego.ultimoCantoGlobal = { jugador: miRol, texto: acepta ? 'Quiero' : 'No quiero' };

    if (tipo === 'Truco!' || tipo === 'Quiero re truco' || tipo === 'Vale Cuatro!') {
        if (acepta) {
            if (tipo === 'Truco!') {
                estadoJuego.nivelTruco = 2;
                estadoJuego.puntosTrucoAceptado = 2;
            } else if (tipo === 'Quiero re truco') {
                estadoJuego.nivelTruco = 3;
                estadoJuego.puntosTrucoAceptado = 3;
            } else if (tipo === 'Vale Cuatro!') {
                estadoJuego.nivelTruco = 4;
                estadoJuego.puntosTrucoAceptado = 4;
            }
            estadoJuego.mensajeEstado = `¡Se quiso el ${tipo}! A jugar.`;
        } else {
            const ptsAbonados = estadoJuego.puntosTrucoAceptado || 1;
            if (emisor === 'J1') estadoJuego.ptsJ1 += ptsAbonados;
            else estadoJuego.ptsJ2 += ptsAbonados;
            
            const emisorNombre = emisor === 'J1' ? estadoJuego.nombreJ1 : estadoJuego.nombreJ2;
            estadoJuego.mensajeEstado = `No se quiso el ${tipo}. Punto(s) para ${emisorNombre}.`;
            estadoJuego.finMano = true;
            await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
            return;
        }
    } else if (tipo.includes('Envido') || tipo.includes('envido')) {
        estadoJuego.envidoCantado = true;
        const cartasJ1Orig = estadoJuego.cartasInicialesJ1 || estadoJuego.cartasJ1;
        const cartasJ2Orig = estadoJuego.cartasInicialesJ2 || estadoJuego.cartasJ2;
        
        const resJ1 = calcularDetalleEnvido(cartasJ1Orig);
        const resJ2 = calcularDetalleEnvido(cartasJ2Orig);
        const envJ1 = resJ1.puntos;
        const envJ2 = resJ2.puntos;
        const manoEsJ1 = estadoJuego.manoJugador === 'J1';

        let textoGloboJ1 = "";
        let textoGloboJ2 = "";

        if (acepta) {
            const ptsGanados = estadoJuego.puntosEnvidoEnJuego;

            if (envJ1 > envJ2) {
                estadoJuego.ptsJ1 += ptsGanados;
                textoGloboJ1 = `${envJ1}`;
                textoGloboJ2 = "Son buenas";
                estadoJuego.mensajeEstado = `¡Tantos Queridos! Gana ${estadoJuego.nombreJ1} (${envJ1}). +${ptsGanados}`;
                estadoJuego.envidoGanadorInfo = { ganador: 'J1', puntos: envJ1, cartas: resJ1.cartasUsadas };
            } else if (envJ2 > envJ1) {
                estadoJuego.ptsJ2 += ptsGanados;
                textoGloboJ1 = "Son buenas";
                textoGloboJ2 = `${envJ2}`;
                estadoJuego.mensajeEstado = `¡Tantos Queridos! Gana ${estadoJuego.nombreJ2} (${envJ2}). +${ptsGanados}`;
                estadoJuego.envidoGanadorInfo = { ganador: 'J2', puntos: envJ2, cartas: resJ2.cartasUsadas };
            } else {
                if (manoEsJ1) { 
                    estadoJuego.ptsJ1 += ptsGanados; 
                    textoGloboJ1 = `${envJ1}`;
                    textoGloboJ2 = "Son buenas";
                    estadoJuego.mensajeEstado = `Empate en ${envJ1}. Gana ${estadoJuego.nombreJ1} por ser Mano (+${ptsGanados}).`; 
                    estadoJuego.envidoGanadorInfo = { ganador: 'J1', puntos: envJ1, cartas: resJ1.cartasUsadas };
                } else { 
                    estadoJuego.ptsJ2 += ptsGanados; 
                    textoGloboJ1 = "Son buenas";
                    textoGloboJ2 = `${envJ2}`;
                    estadoJuego.mensajeEstado = `Empate en ${envJ2}. Gana ${estadoJuego.nombreJ2} por ser Mano (+${ptsGanados}).`; 
                    estadoJuego.envidoGanadorInfo = { ganador: 'J2', puntos: envJ2, cartas: resJ2.cartasUsadas };
                }
            }
        } else {
            const ptsRechazo = estadoJuego.puntosEnvidoRechazo;
            if (emisor === 'J1') { estadoJuego.ptsJ1 += ptsRechazo; textoGloboJ1 = `${envJ1}`; textoGloboJ2 = "No se quiere"; }
            else { estadoJuego.ptsJ2 += ptsRechazo; textoGloboJ1 = "No se quiere"; textoGloboJ2 = `${envJ2}`; }
            estadoJuego.mensajeEstado = `No se quiso el ${tipo}. +${ptsRechazo} pt(s).`;
        }

        mostrarGloboDialogo(true, soyJ1 ? textoGloboJ1 : textoGloboJ2);
        mostrarGloboDialogo(false, soyJ1 ? textoGloboJ2 : textoGloboJ1);

        setTimeout(async () => {
            const esMiTurno = estadoJuego.turnoActual === miRol;
            estadoJuego.mensajeEstado = esMiTurno ? '¡Es tu turno!' : 'Esperando a tu rival...';
            await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
        }, 3000);
    }

    await enviarAccionSupabase('ACTUALIZAR_ESTADO', estadoJuego);
}

function calcularDetalleEnvido(cartas) {
    let max = 0;
    let cartasUsadas = [cartas[0]];
    const palos = { E: [], B: [], C: [], O: [] };
    
    cartas.forEach(c => palos[c.palo].push(c));

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

function limpiarEstadoJuego() {
    if (canal) supabaseClient.removeChannel(canal);
    localStorage.removeItem('truco_salaId');
    localStorage.removeItem('truco_soyJ1');
    salaId = null;
    soyJ1 = false;
}