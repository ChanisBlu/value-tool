// 1. LISTA DE MESES: Para llenar los dropdowns
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// 2. INICIO: Configuración al cargar la página
window.onload = function() {
    inicializarSelectores('1'); // Llena slots de fecha 1
    inicializarSelectores('2'); // Llena slots de fecha 2
    setHoy();                   // Pone fecha actual en el slot 2
};

// 3. GENERADOR DE OPCIONES: Crea los meses y años (Hasta 100 años al futuro y 1900 atrás)
function inicializarSelectores(id) {
    const selMonth = document.getElementById(`m${id}`);
    const selYear = document.getElementById(`a${id}`);
    const currentYear = new Date().getFullYear();

    // NOTA: Agregar meses al dropdown
    meses.forEach((m, i) => selMonth.options.add(new Option(m, i + 1)));
    
    // NOTA: Cambiamos el límite a +100 para que sea "infinito" para cálculos de vida
    for (let i = currentYear + 100; i >= 1900; i--) {
        selYear.options.add(new Option(i, i));
    }
    
    actualizarDias(id); // Genera los días según el mes/año inicial
}

// 4. ACTUALIZADOR DE DÍAS: Ajusta el máximo de días del mes (ej. Feb tiene 28/29)
function actualizarDias(id) {
    const selDay = document.getElementById(`d${id}`);
    const month = parseInt(document.getElementById(`m${id}`).value);
    const year = parseInt(document.getElementById(`a${id}`).value);
    const lastDay = new Date(year, month, 0).getDate(); 
    
    const prevVal = selDay.value; 
    selDay.innerHTML = ""; 
    for (let i = 1; i <= lastDay; i++) {
        selDay.options.add(new Option(i, i));
    }
    
    if (prevVal && prevVal <= lastDay) selDay.value = prevVal;
}

// 5. BOTÓN HOY: Lógica para que el día no se resetee a 1
function setHoy() {
    const hoy = new Date();
    const d = hoy.getDate();
    const m = hoy.getMonth() + 1;
    const a = hoy.getFullYear();

    document.getElementById('a2').value = a;
    document.getElementById('m2').value = m;
    actualizarDias('2'); 
    document.getElementById('d2').value = d; 

    calcularTodo();
}

// 6. FORMATEO DE MILES: Agrega comas (1,000,000) mientras escribes
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

// 7. VALOR LIMPIO: Convierte texto a número puro
function getRawValue(id) {
    let val = document.getElementById(id).value;
    return parseFloat(val.replace(/,/g, '')) || 0;
}

// 8. MOTOR DE CÁLCULO PRINCIPAL
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
        const f1 = new Date(document.getElementById('a1').value, document.getElementById('m1').value - 1, document.getElementById('d1').value);
        const f2 = new Date(document.getElementById('a2').value, document.getElementById('m2').value - 1, document.getElementById('d2').value);
        
        if (f1 > f2) {
            displayValor.innerText = "Fechas inválidas";
            displayEtiqueta.innerText = "Error:";
            displayDetalle.innerText = "La fecha de inicio debe ser anterior.";
            return; 
        }

        const diff = f2 - f1;
        const dias = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
        resultado = monto / dias;
        etiqueta = "Costo por día:";
        detalle = `Basado en ${dias} días de uso.`;

    } else if (modo === 'interes') {
        const tasa1 = getRawValue('tasa-1') / 100 || 0;
        const tasa2 = getRawValue('tasa-2') / 100 || 0;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * tasa1) : ((Math.min(monto, tope) * tasa1) + (Math.max(0, monto - tope) * tasa2));
        resultado = rendimientoAnual / 360; 
        etiqueta = "Ganancia diaria:";
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

// 9. INTERFAZ DINÁMICA
function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

// 10. COMPARTIR
function compartir() {
    const texto = `Value: Mi resultado es ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else {
        alert("Copiado al portapapeles");
    }
}