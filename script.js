function formatAndCalculate(input) {
    let cursorPosition = input.selectionStart;
    let oldLength = input.value.length;
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    if (value !== "") {
        let formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        input.value = parts.length === 2 ? formatted + "." + parts[1] : formatted;
    } else {
        input.value = "";
    }

    let newLength = input.value.length;
    input.setSelectionRange(cursorPosition + (newLength - oldLength), cursorPosition + (newLength - oldLength));
    calcularTodo();
}

function getRawValue(id) {
    let val = document.getElementById(id).value;
    return parseFloat(val.replace(/,/g, '')) || 0;
}

function setHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-fin').value = hoy;
    calcularTodo();
}

function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

function calcularTodo() {
    const monto = getRawValue('precio');
    const divisa = document.getElementById('divisa').value;
    const modo = document.getElementById('metodo').value;
    const displayValor = document.getElementById('resultado-valor');
    const displayEtiqueta = document.getElementById('etiqueta-resultado');
    const displayDetalle = document.getElementById('detalle-tiempo');

    let resultado = 0;
    let etiqueta = "";
    let detalle = "";

    if (modo === 'fechas') {
        const inicioVal = document.getElementById('fecha-inicio').value;
        const finVal = document.getElementById('fecha-fin').value;
        if (inicioVal && finVal) {
            const inicio = new Date(inicioVal);
            const fin = new Date(finVal);
            if (fin > inicio) {
                const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
                resultado = monto / dias;
                etiqueta = "Costo por día:";
                detalle = `Basado en un periodo de ${dias} días.`;
            }
        }
    } else if (modo === 'interes') {
        const tasa1 = getRawValue('tasa-1') / 100 || 0;
        const tasa2 = getRawValue('tasa-2') / 100 || 0;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * tasa1) : ((Math.min(monto, tope) * tasa1) + (Math.max(0, monto - tope) * tasa2));
        resultado = rendimientoAnual / 360; 
        etiqueta = "Ganancia diaria estimada:";
        detalle = `Ganancia mensual aprox (30 días): ${divisa}${(resultado * 30).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    } else if (modo === 'veces') {
        const veces = getRawValue('input-veces');
        if (veces > 0) {
            resultado = monto / veces;
            etiqueta = "Costo por uso/hora:";
            detalle = `Distribuido en ${veces} unidades.`;
        }
    }

    if (monto > 0 && resultado > 0) {
        displayValor.innerText = divisa + resultado.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        displayEtiqueta.innerText = etiqueta;
        displayDetalle.innerText = detalle;
    } else {
        displayValor.innerText = divisa + "0.00";
        displayDetalle.innerText = "";
    }
}

function compartir() {
    const texto = `Value: Mi resultado es ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else {
        alert("Copiado al portapapeles");
    }
}
