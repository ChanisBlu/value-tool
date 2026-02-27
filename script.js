// 1. LISTA DE MESES: Para llenar los dropdowns
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// 2. INICIO: Configuración al cargar la página
window.onload = function() {
    inicializarSelectores('1'); // Llena slots de fecha 1
    inicializarSelectores('2'); // Llena slots de fecha 2
    setHoy();                   // Pone fecha actual en el slot 2
};

// 3. LLENADO DE SELECTS: Crea los meses y años (de 2031 a 1900)
function inicializarSelectores(id) {
    const selMonth = document.getElementById(`m${id}`);
    const selYear = document.getElementById(`a${id}`);
    const currentYear = new Date().getFullYear();

    // NOTA: Agregar meses al dropdown
    meses.forEach((m, i) => selMonth.options.add(new Option(m, i + 1)));
    
    // NOTA: Agregar años al dropdown (rango de 130 años aprox)
    for (let i = currentYear + 5; i >= 1900; i--) {
        selYear.options.add(new Option(i, i));
    }
    
    actualizarDias(id); // Genera los días según el mes/año inicial
}

// 4. GENERADOR DE DÍAS: Ajusta el máximo de días del mes (ej. Feb tiene 28/29)
function actualizarDias(id) {
    const selDay = document.getElementById(`d${id}`);
    const month = parseInt(document.getElementById(`m${id}`).value);
    const year = parseInt(document.getElementById(`a${id}`).value);
    const lastDay = new Date(year, month, 0).getDate(); // Truco JS para saber el último día
    
    const prevVal = selDay.value; // Guardar qué día estaba marcado antes
    selDay.innerHTML = ""; // Limpiar opciones
    for (let i = 1; i <= lastDay; i++) {
        selDay.options.add(new Option(i, i));
    }
    
    // NOTA: Si el día marcado anteriormente sigue existiendo, lo mantenemos
    if (prevVal && prevVal <= lastDay) selDay.value = prevVal;
}

// 5. BOTÓN HOY: Lógica corregida para que el día no se resetee a 1
function setHoy() {
    const hoy = new Date();
    const d = hoy.getDate();
    const m = hoy.getMonth() + 1;
    const a = hoy.getFullYear();

    document.getElementById('a2').value = a;
    document.getElementById('m2').value = m;
    actualizarDias('2'); // NOTA: Esto es vital para que el dropdown sepa que existen 28, 30 o 31 días
    document.getElementById('d2').value = d; // Ahora sí marcamos el día correcto

    calcularTodo();
}

// 6. FORMATEO DE MILES: Agrega comas (1,000,000) mientras escribes
function formatAndCalculate(input) {
    let cursorPosition = input.selectionStart;
    let oldLength = input.value.length;
    let value = input.value.replace(/[^0-9.]/g, ''); // Limpiar caracteres no numéricos
    let parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    if (value !== "") {
        let formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        input.value = parts.length === 2 ? formatted + "." + parts[1] : formatted;
    } else {
        input.value = "";
    }

    // NOTA: Ajustar cursor para que no salte al final al poner la coma
    let newLength = input.value.length;
    input.setSelectionRange(cursorPosition + (newLength - oldLength), cursorPosition + (newLength - oldLength));
    calcularTodo();
}

// 7. VALOR LIMPIO: Convierte "1,000" en número para matemáticas
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

    // NOTA: Lógica para cálculo por fechas (Uso Real)
    if (modo === 'fechas') {
        const f1 = new Date(document.getElementById('a1').value, document.getElementById('m1').value - 1, document.getElementById('d1').value);
        const f2 = new Date(document.getElementById('a2').value, document.getElementById('m2').value - 1, document.getElementById('d2').value);
        
        // REGLA: Si la fecha de inicio es después de la de fin, mostramos error
        if (f1 > f2) {
            displayValor.innerText = "Fechas inválidas";
            displayEtiqueta.innerText = "Error:";
            displayDetalle.innerText = "La fecha de inicio debe ser anterior.";
            return; // NOTA: Detenemos la función aquí
        }

        const diff = f2 - f1;
        const dias = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
        resultado = monto / dias;
        etiqueta = "Costo por día:";
        detalle = `Basado en ${dias} días de uso.`;

    // NOTA: Lógica para interés (360 días bancarios)
    } else if (modo === 'interes') {
        const tasa1 = getRawValue('tasa-1') / 100 || 0;
        const tasa2 = getRawValue('tasa-2') / 100 || 0;
        const tope = getRawValue('tope');
        let rendimientoAnual = (tope === 0) ? (monto * tasa1) : ((Math.min(monto, tope) * tasa1) + (Math.max(0, monto - tope) * tasa2));
        resultado = rendimientoAnual / 360; 
        etiqueta = "Ganancia diaria:";
        detalle = `Ganancia mensual aprox (30 días): ${divisa}${(resultado * 30).toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    // NOTA: Lógica para frecuencia manual
    } else if (modo === 'veces') {
        const veces = getRawValue('input-veces');
        if (veces > 0) {
            resultado = monto / veces;
            etiqueta = "Costo por uso/hora:";
            detalle = `Distribuido en ${veces} unidades.`;
        }
    }

    // NOTA: Pintar el resultado si todo es correcto
    if (monto > 0 && resultado > 0) {
        displayValor.innerText = divisa + resultado.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        displayEtiqueta.innerText = etiqueta;
        displayDetalle.innerText = detalle;
    } else {
        displayValor.innerText = divisa + "0.00";
        displayDetalle.innerText = "";
    }
}

// 9. INTERFAZ DINÁMICA: Mostrar u ocultar secciones según el dropdown
function cambiarModo() {
    const modo = document.getElementById('metodo').value;
    document.querySelectorAll('.modo-input').forEach(el => el.style.display = 'none');
    document.getElementById(`seccion-${modo}`).style.display = 'block';
    calcularTodo();
}

// 10. COMPARTIR: API nativa del navegador
function compartir() {
    const texto = `Value: Mi resultado es ${document.getElementById('resultado-valor').innerText}`;
    if (navigator.share) {
        navigator.share({ title: 'Value Tool', text: texto, url: window.location.href });
    } else {
        alert("Copiado al portapapeles");
    }
}