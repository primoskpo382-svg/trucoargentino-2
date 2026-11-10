// js/payments.js
async function comprarFichasMP() {
    const cant = Number(document.getElementById('cantidadComprar').value);
    if (!cant || cant <= 0) {
        document.getElementById('msgComprar').innerText = "Ingresá un monto válido.";
        return;
    }
    document.getElementById('msgComprar').innerText = "Generando pago...";
    try {
        const resp = await fetch(`${API_URL}/crear-preferencia-mp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId, cantidad: cant })
        });
        const datos = await resp.json();
        if (datos.init_point) {
            window.location.href = datos.init_point;
        } else {
            document.getElementById('msgComprar').innerText = "Error al conectar con Mercado Pago.";
        }
    } catch(e) {
        document.getElementById('msgComprar').innerText = "Error de red al procesar compra.";
    }
}

async function solicitarRetiroFichas() {
    const cant = Number(document.getElementById('cantidadRetirar').value);
    const alias = document.getElementById('aliasCbu').value.trim();
    const msg = document.getElementById('msgRetirar');

    if (!cant || cant < 100) {
        msg.innerText = "El retiro mínimo es de $100.";
        msg.className = "text-xs mt-2 text-rose-400";
        return;
    }
    if (cant > saldoFichasActual) {
        msg.innerText = "No tenés suficiente saldo para este retiro.";
        msg.className = "text-xs mt-2 text-rose-400";
        return;
    }
    if (!alias) {
        msg.innerText = "Ingresá un CBU o Alias válido.";
        msg.className = "text-xs mt-2 text-rose-400";
        return;
    }

    msg.innerText = "Enviando solicitud...";
    msg.className = "text-xs mt-2 text-amber-300";

    try {
        const resp = await fetch(`${API_URL}/solicitar-retiro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId, cantidad: cant, destino: alias })
        });
        const resData = await resp.json();
        if (resp.ok) {
            await actualizarSaldoBD(saldoFichasActual - cant);
            msg.innerText = "¡Solicitud enviada con éxito!";
            msg.className = "text-xs mt-2 text-emerald-400";
            setTimeout(() => toggleModal('modalRetirar'), 2000);
        } else {
            msg.innerText = resData.error || "Error al procesar el retiro.";
            msg.className = "text-xs mt-2 text-rose-400";
        }
    } catch(e) {
        msg.innerText = "Error de conexión con el servidor.";
        msg.className = "text-xs mt-2 text-rose-400";
    }
}