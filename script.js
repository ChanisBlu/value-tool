// 1. CONFIGURACIÓN: Meses y arranque
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

window.onload = function() {
    inicializarSelectores('1');
    inicializarSelectores('2');
    
    // NOTA: Sincronización inicial al presente en ambos slots
    const hoy = new Date();
    document.getElementById('a1').value = hoy.getFullYear();
    document.getElementById('m1').value = hoy.getMonth() + 1;
    actualizarDias('1');
    document.getElementById('d1').value = hoy.getDate();
    setHoy(); 
};

// 2. FECHAS: Generación de slots y sincronización
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

// 4. MOTOR DE CÁLCULO
function calcularTodo() {
    const monto = getRawValue('precio');
    const divisa = document.getElementById('divisa').value;
    const modo = document.getElementById('metodo').value;
    const displayValor = document.getElementById('resultado-valor');
    const displayEtiqueta = document.getElementById('etiqueta-resultado');
    const displayDetalle = document.getElementById('detalle-tiempo');

    const formatConfig = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

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
        displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
        displayEtiqueta.innerText = "Costo por día:";
        displayDetalle.innerText = `Basado en ${dias.toLocaleString()} días de uso acumulados.`;

    } else if (modo === 'interes') {
        const t1 = getRawValue('tasa-1') / 100;
        const t2 = getRawValue('tasa-2') / 100;
        const tope = getRawValue('tope');
        let rAnual = (tope === 0) ? (monto * t1) : ((Math.min(monto, tope) * t1) + (Math.max(0, monto - tope) * t2));
        const res = rAnual / 360; // Año comercial
        displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
        displayEtiqueta.innerText = "Ganancia diaria:";
        displayDetalle.innerText = `Ganancia mensual aprox: ${divisa}${(res * 30).toLocaleString('en-US', formatConfig)}`;

    } else if (modo === 'salario') {
        const sal = getRawValue('input-salario');
        const hEntrada = getRawValue('input-horas-salario');
        const freq = document.getElementById('tipo-horas').value;
        if (sal > 0 && hEntrada > 0 && monto > 0) {
            let hMensuales = (freq === 'semana') ? (hEntrada * 4.33) : hEntrada;
            let hDiarias = (freq === 'semana') ? (hEntrada / 5) : (hEntrada / 22);
            const valH = sal / hMensuales;
            const hEq = monto / valH;
            const dEq = hEq / hDiarias;
            const mEq = monto / sal;
            const aEq = mEq / 12;
            displayEtiqueta.innerText = "Tu tiempo vale:";
            displayValor.innerText = `${divisa}${valH.toLocaleString('en-US', formatConfig)} / h`;
            displayDetalle.innerHTML = `Necesitas:<br>
                • <strong>${hEq.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Horas totales<br>
                • <strong>${dEq.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Días laborales<br>
                • <strong>${mEq.toLocaleString('en-US', {maximumFractionDigits: 1})}</strong> Meses de salario<br>
                • <strong>${aEq.toLocaleString('en-US', {maximumFractionDigits: 2})}</strong> Años de esfuerzo`;
        } else {
            displayValor.innerText = divisa + "0.00";
            displayDetalle.innerText = "Ingresa tu salario para dimensionar.";
        }
    } else if (modo === 'veces') {
        const v = getRawValue('input-veces');
        if (v > 0) {
            const res = monto / v;
            displayValor.innerText = divisa + res.toLocaleString('en-US', formatConfig);
            displayEtiqueta.innerText = "Costo por uso:";
            displayDetalle.innerText = `Distribuido en ${v} unidades de uso.`;
        }
    }
}

// 5. INTERFAZ: Dinámica de pantalla y descripciones
function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    const labelMonto = document.getElementById('label-monto');
    const descModo = document.getElementById('descripcion-modo');
    const descripciones = {
        'fechas': "Ideal para suscripciones o compras grandes. Mira cuánto te cuesta un objeto por cada día que pasa desde que lo compraste.",
        'interes': "Calcula tus ganancias diarias en cuentas de ahorro (como Nu o Didi) considerando tasas base y excedentes.",
        'veces': "Perfecto para ropa o gadgets. ¿Cuánto pagas por cada vez que te pones esos tenis o usas esa herramienta?",
        'salario': "El golpe de realidad. Mira cuántas horas, días o meses de trabajo real representa esa compra en tu vida."
    };
    descModo.innerText = descripciones[modo];
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