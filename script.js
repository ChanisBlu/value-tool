// 1. CONFIGURACIÓN: Nombres de meses y arranque de la App
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

window.onload = function() {
    inicializarSelectores('1');
    inicializarSelectores('2');
    
    // NOTA: Seteamos HOY en ambas fechas por defecto al iniciar
    const hoy = new Date();
    const d = hoy.getDate();
    const m = hoy.getMonth() + 1;
    const a = hoy.getFullYear();

    // Seteamos 'Desde'
    document.getElementById('a1').value = a;
    document.getElementById('m1').value = m;
    actualizarDias('1');
    document.getElementById('d1').value = d;

    // Seteamos 'Hasta' usando la función global
    setHoy();
};

// 2. FECHAS: Lógica de Dropdowns y Slots
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

// 3. FORMATEO: Comas para miles y Puntos para decimales ($1,000.00)
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

// 4. MOTOR DE CÁLCULO: Donde ocurre la magia
function calcularTodo() {
    const monto = getRawValue('precio');
    const divisa = document.getElementById('divisa').value;
    const modo = document.getElementById('metodo').value;
    const displayValor = document.getElementById('resultado-valor');
    const displayEtiqueta = document.getElementById('etiqueta-resultado');
    const displayDetalle = document.getElementById('detalle-tiempo');

    // Configuración estándar: Coma para miles, Punto para decimales ($0.00)
    const formatConfig = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    if (modo === 'fechas') {
        const f1 = new Date(document.getElementById('a1').value, document.getElementById('m1').value - 1, document.getElementById('d1').value);
        const f2 = new Date(document.getElementById('a2').value, document.getElementById('m2').value - 1, document.getElementById('d2').value);
        
        if (f1 > f2) {
            displayValor.innerText = "Fechas inválidas";
            displayEtiqueta.innerText = "Error:";
            displayDetalle.innerText = "La fecha 'Desde' debe ser anterior.";
            return;
        }

        const dias = Math.ceil((f2 - f1) / (1000 * 60 * 60 * 24)) || 1;
        const res = monto / dias;
        displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
        displayEtiqueta.innerText = "Costo por día:";
        displayDetalle.innerText = `Basado en ${dias.toLocaleString()} días de uso acumulados.`;

    } else if (modo === 'interes') {
        const t1 = getRawValue('tasa-1') / 100;
        const t2 = getRawValue('tasa-2') / 100;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * t1) : ((Math.min(monto, tope) * t1) + (Math.max(0, monto - tope) * t2));
        const res = rendimientoAnual / 360; // Año comercial bancario
        
        displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
        displayEtiqueta.innerText = "Ganancia diaria:";
        displayDetalle.innerText = `Ganancia mensual aprox: ${divisa}${(res * 30).toLocaleString('en-US', formatConfig)}`;

    } else if (modo === 'salario') {
        const salario = getRawValue('input-salario');
        const horasEntrada = getRawValue('input-horas-salario');
        const frecuencia = document.getElementById('tipo-horas').value;

        if (salario > 0 && horasEntrada > 0 && monto > 0) {
            // Lógica de equivalencias independientes
            let hMensuales = (frecuencia === 'semana') ? (horasEntrada * 4.33) : horasEntrada;
            let hDiarias = (frecuencia === 'semana') ? (horasEntrada / 5) : (horasEntrada / 22);
            
            const valorHora = salario / hMensuales;
            const hEquiv = monto / valorHora;
            const dEquiv = hEquiv / hDiarias;
            const mEquiv = monto / salario;
            const aEquiv = mEquiv / 12;

            displayEtiqueta.innerText = "Tu tiempo vale:";
            displayValor.innerText = `${divisa}${valorHora.toLocaleString('en-US', formatConfig)} / h`;
            
            displayDetalle.innerHTML = `Necesitas:<br>
                • <strong>${hEquiv.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Horas totales<br>
                • <strong>${dEquiv.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Días laborales<br>
                • <strong>${mEquiv.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Meses de salario<br>
                • <strong>${aEquiv.toLocaleString('en-US', {maximumFractionDigits: 2})}</strong> Años de esfuerzo`;
        } else {
            displayValor.innerText = divisa + "0.00";
            displayDetalle.innerText = "Ingresa tu salario para dimensionar.";
        }
    } else if (modo === 'veces') {
        const veces = getRawValue('input-veces');
        if (veces > 0) {
            const res = monto / veces;
            displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
            displayEtiqueta.innerText = "Costo por uso:";
            displayDetalle.innerText = `Distribuido en ${veces} unidades.`;
        }
    }
}

// 5. INTERFAZ: Dinámica de pantalla
function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    const labelMonto = document.getElementById('label-monto');
    labelMonto.innerText = (modo === 'interes') ? "Dinero invertido" : "Precio del Objeto";
    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

function compartir() {
    const texto = `Value: Mi resultado es ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else { alert("Link copiado al portapapeles"); }
}