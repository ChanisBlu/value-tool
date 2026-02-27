// NOTA: Meses para dropdowns
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// NOTA: Inicio automático. Ahora ponemos HOY en ambas fechas por default
window.onload = function() {
    inicializarSelectores('1');
    inicializarSelectores('2');
    
    const hoy = new Date();
    // NOTA: Seteamos 'Desde' a hoy
    document.getElementById('a1').value = hoy.getFullYear();
    document.getElementById('m1').value = hoy.getMonth() + 1;
    actualizarDias('1');
    document.getElementById('d1').value = hoy.getDate();
    
    // NOTA: Seteamos 'Hasta' a hoy
    setHoy();
};

// NOTA: Llena dropdowns con 100 años al futuro
function inicializarSelectores(id) {
    const selMonth = document.getElementById(`m${id}`);
    const selYear = document.getElementById(`a${id}`);
    const currentYear = new Date().getFullYear();
    meses.forEach((m, i) => selMonth.options.add(new Option(m, i + 1)));
    for (let i = currentYear + 100; i >= 1900; i--) selYear.options.add(new Option(i, i));
    actualizarDias(id);
}

// NOTA: Ajusta el máximo de días por mes
function actualizarDias(id) {
    const selDay = document.getElementById(`d${id}`);
    const month = parseInt(document.getElementById(`m${id}`).value);
    const year = parseInt(document.getElementById(`a${id}`).value);
    const lastDay = new Date(year, month, 0).getDate();
    const prevVal = selDay.value;
    selDay.innerHTML = "";
    for (let i = 1; i <= lastDay; i++) selDay.options.add(new Option(i, i));
    if (prevVal && prevVal <= lastDay) selDay.value = prevVal;
}

// NOTA: Función para poner fecha actual en el slot 2
function setHoy() {
    const hoy = new Date();
    document.getElementById('a2').value = hoy.getFullYear();
    document.getElementById('m2').value = hoy.getMonth() + 1;
    actualizarDias('2');
    document.getElementById('d2').value = hoy.getDate();
    calcularTodo();
}

// NOTA: Formateo de comas en tiempo real
function formatAndCalculate(input) {
    let cursorPosition = input.selectionStart;
    let oldLength = input.value.length;
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    if (value !== "") {
        let formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        input.value = parts.length === 2 ? formatted + "." + parts[1] : formatted;
    } else { input.value = ""; }
    let newLength = input.value.length;
    input.setSelectionRange(cursorPosition + (newLength - oldLength), cursorPosition + (newLength - oldLength));
    calcularTodo();
}

// NOTA: Obtener valor numérico limpio
function getRawValue(id) {
    let val = document.getElementById(id).value;
    return parseFloat(val.replace(/,/g, '')) || 0;
}

// NOTA: MOTOR DE CÁLCULO
function calcularTodo() {
    const monto = getRawValue('precio');
    const divisa = document.getElementById('divisa').value;
    const modo = document.getElementById('metodo').value;
    const displayValor = document.getElementById('resultado-valor');
    const displayEtiqueta = document.getElementById('etiqueta-resultado');
    const displayDetalle = document.getElementById('detalle-tiempo');

    // MODO: FECHAS
    if (modo === 'fechas') {
        const f1 = new Date(document.getElementById('a1').value, document.getElementById('m1').value - 1, document.getElementById('d1').value);
        const f2 = new Date(document.getElementById('a2').value, document.getElementById('m2').value - 1, document.getElementById('d2').value);
        if (f1 > f2) {
            displayValor.innerText = "Fechas inválidas";
            displayEtiqueta.innerText = "Error:";
            displayDetalle.innerText = "La fecha de inicio debe ser anterior.";
            return;
        }
        const dias = Math.ceil((f2 - f1) / (1000 * 60 * 60 * 24)) || 1;
        const res = monto / dias;
        displayValor.innerText = divisa + res.toLocaleString(undefined, {minimumFractionDigits: 2});
        displayEtiqueta.innerText = "Costo por día:";
        displayDetalle.innerText = `Basado en ${dias} días de uso.`;

    // MODO: INTERÉS (Año comercial 360 días)
    } else if (modo === 'interes') {
        const t1 = getRawValue('tasa-1') / 100;
        const t2 = getRawValue('tasa-2') / 100;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * t1) : ((Math.min(monto, tope) * t1) + (Math.max(0, monto - tope) * t2));
        const res = rendimientoAnual / 360;
        displayValor.innerText = divisa + res.toLocaleString(undefined, {minimumFractionDigits: 2});
        displayEtiqueta.innerText = "Ganancia diaria:";
        displayDetalle.innerText = `Ganancia mensual aprox: ${divisa}${(res * 30).toLocaleString()}`;

    // MODO: VECES
    } else if (modo === 'veces') {
        const veces = getRawValue('input-veces');
        if (veces > 0) {
            const res = monto / veces;
            displayValor.innerText = divisa + res.toLocaleString(undefined, {minimumFractionDigits: 2});
            displayEtiqueta.innerText = "Costo por uso:";
            displayDetalle.innerText = `Distribuido en ${veces} unidades.`;
        }

    // MODO: SALARIO
    } else if (modo === 'salario') {
        const salario = getRawValue('input-salario');
        const horasIngresadas = getRawValue('input-horas-salario');
        const tipoHoras = document.getElementById('tipo-horas').value;

        if (salario > 0 && horasIngresadas > 0 && monto > 0) {
            let horasMensuales = (tipoHoras === 'semana') ? (horasIngresadas * 4.33) : horasIngresadas;
            const valorHora = salario / horasMensuales;
            const totalHorasVida = monto / valorHora;
            const horasAlDia = (tipoHoras === 'semana') ? (horasIngresadas / 5) : (horasMensuales / 22);
            
            const totalDiasVida = totalHorasVida / horasAlDia;
            const totalMesesVida = monto / salario;
            const totalAnosVida = totalMesesVida / 12;

            displayEtiqueta.innerText = "Tu tiempo vale:";
            displayValor.innerText = `${divisa}${valorHora.toLocaleString(undefined, {minimumFractionDigits: 2})} / h`;
            
            displayDetalle.innerHTML = `Necesitas:<br>
                • <strong>${totalHorasVida.toFixed(1)}</strong> horas de vida<br>
                • <strong>${totalDiasVida.toFixed(1)}</strong> días de trabajo<br>
                • <strong>${totalMesesVida.toFixed(1)}</strong> meses de salario<br>
                • <strong>${totalAnosVida.toFixed(2)}</strong> años de esfuerzo`;
        } else {
            displayValor.innerText = divisa + "0.00";
            displayDetalle.innerText = "Completa los datos de salario.";
        }
    }
}

// NOTA: Cambio de vista y actualización de labels
function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    const labelMonto = document.getElementById('label-monto');

    // NOTA: Cambiamos el texto del label según el modo
    if (modo === 'interes') {
        labelMonto.innerText = "Dinero invertido";
    } else {
        labelMonto.innerText = "Precio del Objeto";
    }

    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

// NOTA: API de compartir
function compartir() {
    const texto = `Value: Mi resultado es ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else { alert("Link copiado"); }
}