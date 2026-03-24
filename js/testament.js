document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(15);
  var tk = sessionStorage.getItem('tk');
  var ek = sessionStorage.getItem('ek');
  if (!tk || !ek) { window.location.href = 'index.html'; return; }

  var d = null, t = null;

  try {
    d = await loadData();
    var h = await hashPassword(tk);
    var he = await hashPassword(ek);
    if (h !== d.testamentHash || he !== d.emergencyHash) { sessionStorage.clear(); window.location.href = 'index.html'; return; }

    t = decryptData(d.testamentData, tk);
    if (!t) { showToast("Testament vide", "info"); return; }

    var ni = t.identity || {};
    document.getElementById('r-nom').textContent = ni.nom || "-";
    document.getElementById('r-prenom').textContent = ni.prenom || "-";
    document.getElementById('r-date').textContent = ni.dateNaissance || "-";
    document.getElementById('r-lieu').textContent = ni.lieuNaissance || "-";
    document.getElementById('r-nat').textContent = ni.nationalite || "-";
    document.getElementById('r-addr').textContent = ni.adresse || "-";

    document.getElementById('r-content').innerHTML = t.content || "-";

    if (t.lastModified) {
      document.getElementById('r-mod').textContent = formatDateFR(t.lastModified);
    }
  } catch (e) {
    showToast("Erreur init testament", "error");
  }

  document.getElementById('btn-logout-t').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-pdf-t').addEventListener('click', function() {
    if (!t) return;
    var pdf = new window.jspdf.jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("TESTAMENT — DERNIÈRES VOLONTÉS", 105, 20, null, null, "center");

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    var y = 40;
    var ni = t.identity || {};
    var ds = "";
    if (ni.dateNaissance) { var dt=new Date(ni.dateNaissance); ds = ("0"+dt.getDate()).slice(-2)+"/"+("0"+(dt.getMonth()+1)).slice(-2)+"/"+dt.getFullYear(); }

    pdf.text("Je soussigné(e), " + (ni.prenom||"") + " " + (ni.nom||"") + ",", 20, y); y += 10;
    pdf.text("Né(e) le " + ds + " à " + (ni.lieuNaissance||"") + ", de nationalité " + (ni.nationalite||"") + ",", 20, y); y += 10;
    pdf.text("Résidant au : " + (ni.adresse||"") + ",", 20, y); y += 15;
    pdf.text("Déclare formuler mes dernières volontés comme suit :", 20, y); y += 15;

    pdf.setFont("helvetica", "bold");
    pdf.text("DISPOSITIONS", 20, y); y += 10;
    pdf.setFont("helvetica", "normal");

    var dmp = document.createElement('div');
    dmp.innerHTML = t.content || "";
    var txt = dmp.textContent || dmp.innerText || "";

    var lines = pdf.splitTextToSize(txt, 170);
    pdf.text(lines, 20, y);

    var lc = lines.length;
    y += (lc * 7) + 20;

    if (y > 270) { pdf.addPage(); y = 30; }

    var fd = new Date();
    var fds = ("0"+fd.getDate()).slice(-2)+"/"+("0"+(fd.getMonth()+1)).slice(-2)+"/"+fd.getFullYear();
    pdf.text("Fait le " + fds, 130, y); y += 10;
    pdf.text("Signature :", 130, y);

    pdf.save("Testament_" + (ni.nom||"") + ".pdf");
  });
});
