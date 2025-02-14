document.getElementById("formulario").addEventListener("submit", async function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    
    const response = await fetch("/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
    });

    const result = await response.json();
    document.getElementById("mensaje").innerText = result.mensaje;
});
