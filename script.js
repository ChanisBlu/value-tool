// NOTA: Meses para dropdowns
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// NOTA: Inicialización de la App
window.onload = function() {
    inicializarSelectores('1');
    inicializarSelectores('2');
    
    // NOTA: Seteamos HOY en ambos slots al iniciar
    const hoy = new Date();
    document.getElementById('a1').value = hoy.getFullYear();
    document.getElementById('m1').value = hoy.getMonth() + 1;
    actualizarDias('1');
    document.getElementById('d1').value = hoy.getDate();
    setHoy();
};

function inicializarSelectores(id) {
    const selMonth = document.getElementById(`m${id}`);
    const selYear = document.getElementById(`a${id}`);
    const currentYear = new Date().getFullYear();
    meses.forEach((m, i) => selMonth.options.add(new Option(m, i + 1)));
    for (let i = currentYear + 100; i >= 1900; i--) selYear.options.add(new Option(i, i));
    actualizarDias(id);
}

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

function setHoy() {
    const hoy = new Date();
    document.getElementById('a2').value = hoy.getFullYear();
    document.getElementById('m2').value = hoy.getMonth() + 1;
    actualizarDias('2');
    document.getElementById('d2').value = hoy.getDate();
    calcularTodo();
}

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

function getRawValue(id) {
    let val = document.getElementById(id).value;
    return parseFloat(val.replace(/,/g, '')) || 0;
}

// NOTA: MOTOR DE CÁLCULO - Lógica de equivalencia corregida
function calcularTodo() {
    const monto = getRawValue('precio');
    const divisa = document.getElementById('divisa').value;
    const modo = document.getElementById('metodo').value;
    const displayValor = document.getElementById('resultado-valor');
    const displayEtiqueta = document.getElementById('etiqueta-resultado');
    const displayDetalle = document.getElementById('detalle-tiempo');

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

    } else if (modo === 'interes') {
        const t1 = getRawValue('tasa-1') / 100;
        const t2 = getRawValue('tasa-2') / 100;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * t1) : ((Math.min(monto, tope) * t1) + (Math.max(0, monto - tope) * t2));
        const res = rendimientoAnual / 360;
        displayValor.innerText = divisa + res.toLocaleString(undefined, {minimumFractionDigits: 2});
        displayEtiqueta.innerText = "Ganancia diaria:";
        displayDetalle.innerText = `Ganancia mensual aprox: ${divisa}${(res * 30).toLocaleString()}`;

    } else if (modo === 'veces') {
        const veces = getRawValue('input-veces');
        if (veces > 0) {
            const res = monto / veces;
            displayValor.innerText = divisa + res.toLocaleString(undefined, {minimumFractionDigits: 2});
            displayEtiqueta.innerText = "Costo por uso:";
            displayDetalle.innerText = `Distribuido en ${veces} unidades.`;
        }

    } else if (modo === 'salario') {
        const salarioNeto = getRawValue('input-salario');
        const horasEntrada = getRawValue('input-horas-salario');
        const frecuencia = document.getElementById('tipo-horas').value;

        if (salarioNeto > 0 && horasEntrada > 0 && monto > 0) {
            // NOTA: Lógica de equivalencia independiente
            let horasMensualesTotales = (frecuencia === 'semana') ? (horasEntrada * 4.33) : horasEntrada;
            let horasDiariasLaborales = (frecuencia === 'semana') ? (horasEntrada / 5) : (horasEntrada / 22);

            const valorHora = salarioNeto / horasMensualesTotales;

            // Resultados Individuales (Equivalencias totales)
            const horasEquiv = monto / valorHora;
            const diasEquiv = horasEquiv / horasDiariasLaborales;
            const mesesEquiv = monto / salarioNeto;
            const anosEquiv = mesesEquiv / 12;

            displayEtiqueta.innerText = "Tu tiempo vale:";
            displayValor.innerText = `${divisa}${valorHora.toLocaleString(undefined, {minimumFractionDigits: 2})} / h`;
            
            displayDetalle.innerHTML = `Necesitas:<br>
                • <strong>${horasEquiv.toLocaleString(undefined, {maximumFractionDigits: 1})}</strong> Horas totales<br>
                • <strong>${diasEquiv.toLocaleString(undefined, {maximumFractionDigits: 1})}</strong> Días laborales<br>
                • <strong>${mesesEquiv.toLocaleString(undefined, {maximumFractionDigits: 1})}</strong> Meses de salario<br>
                • <strong>${anosEquiv.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> Años de esfuerzo`;
        } else {
            displayValor.innerText = divisa + "0.00";
            displayDetalle.innerText = "Completa los datos de salario.";
        }
    }
}

function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    const labelMonto = document.getElementById('label-monto');
    labelMonto.innerText = (modo === 'interes') ? "Dinero invertido" : "Precio del Objeto";
    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

function compartir() {
    const texto = `Value: Mi tiempo vale ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else { alert("Copiado al portapapeles"); }
}