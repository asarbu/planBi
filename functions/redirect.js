export async function onRequestGet() {
    //return Response.redirect('https://google.ro', 302);
    return await fetch('/calendar', { method: 'POST' });
}