

function formatRupiah(angka) {
    if (typeof angka === 'string') return angka;
    return 'Rp ' + angka.toLocaleString('id-ID');
}

// 1. LOGIN & MODAL FUNCTIONS
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const userFound = dataPengguna.find(u => u.email === email && u.password === password);

    if (userFound) {
        alert("Login Berhasil! Selamat datang, " + userFound.nama + " (" + userFound.role + ")");
        localStorage.setItem('loggedInUser', JSON.stringify(userFound));
        window.location.href = "dashboard.html";
    } else {
        alert("email/password yang anda masukkan salah");
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

function handleResetPassword(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value;
    alert("Instruksi reset password telah dikirim ke " + email);
    closeModal('modalLupaPassword');
}

function handleRegister(event) {
    event.preventDefault();
    const nama = document.getElementById('regNama').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    dataPengguna.push({
        id: dataPengguna.length + 1,
        nama: nama,
        email: email,
        password: password,
        role: "User"
    });

    alert("Pendaftaran berhasil untuk " + nama + ". Silakan Login.");
    closeModal('modalDaftar');
}

// 2. DASHBOARD GREETING
function renderDashboardGreeting() {
    const greetingEl = document.getElementById('greetingText');
    const timeDetailEl = document.getElementById('timeDetail');
    if (!greetingEl) return;

    const now = new Date();
    const hours = now.getHours();
    let greeting = "";

    if (hours >= 5 && hours < 11) greeting = "Selamat Pagi";
    else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
    else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    const loggedUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userName = loggedUser.nama ? ", " + loggedUser.nama : "";

    greetingEl.innerText = greeting + userName + "! Selamat Datang di Toko Buku.";
    timeDetailEl.innerText = "Waktu Lokal Anda: " + now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = dummyHistory.map(h => `
        <tr>
            <td><b>${h.noOrder}</b></td>
            <td>${h.tanggal}</td>
            <td>${h.total}</td>
            <td><span class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;">${h.status}</span></td>
        </tr>
    `).join('');
}

// 3. STOK & KATALOG DOM MANIPULATION
let localKatalog = [...dataKatalogBuku];

function renderStokTable() {
    const tbody = document.getElementById('stokTableBody');
    if (!tbody) return;

    tbody.innerHTML = "";
    localKatalog.forEach((buku, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${buku.cover}" alt="${buku.namaBarang}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;" onerror="this.src='https://via.placeholder.co/45x60?text=Buku'"></td>
            <td><b>${buku.kodeBarang}</b></td>
            <td>${buku.namaBarang}</td>
            <td>${buku.jenisBarang}</td>
            <td>Edisi ${buku.edisi}</td>
            <td>${typeof buku.harga === 'number' ? formatRupiah(buku.harga) : buku.harga}</td>
            <td><span style="font-weight:bold; color: ${buku.stok < 200 ? 'red' : 'green'};">${buku.stok}</span></td>
            <td>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="hapusStok(${index})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handleTambahStok(event) {
    event.preventDefault();
    const kode = document.getElementById('inputKode').value.trim();
    const nama = document.getElementById('inputNama').value.trim();
    const jenis = document.getElementById('inputJenis').value.trim();
    const edisi = document.getElementById('inputEdisi').value.trim();
    const harga = document.getElementById('inputHarga').value.trim();
    const stok = parseInt(document.getElementById('inputStok').value);

    localKatalog.push({
        kodeBarang: kode,
        namaBarang: nama,
        jenisBarang: jenis,
        edisi: edisi,
        harga: harga.startsWith('Rp') ? harga : 'Rp ' + parseInt(harga).toLocaleString('id-ID'),
        stok: stok,
        cover: "img/pengantar_komunikasi.jpg"
    });
    renderStokTable();

    alert("Berhasil menambahkan baris stok buku baru!");
    document.getElementById('formTambahStok').reset();
    closeModal('modalTambahStok');
}

function hapusStok(index) {
    if (confirm("Hapus baris stok buku ini?")) {
        localKatalog.splice(index, 1);
        renderStokTable();
    }
}

// 4. CHECKOUT CART HANDLING
let cartItems = [
    { kodeBarang: "ASIP4301", namaBarang: "Pengantar Ilmu Komunikasi", hargaNum: 180000, harga: "Rp 180.000", qty: 1, cover: "img/pengantar_komunikasi.jpg" },
    { kodeBarang: "EKMA4002", namaBarang: "Manajemen Keuangan", hargaNum: 220000, harga: "Rp 220.000", qty: 1, cover: "img/manajemen_keuangan.jpg" }
];

function initCheckoutPage() {
    renderCartTable();
}

function renderCartTable() {
    const tbody = document.getElementById('cartTableBody');
    const totalEl = document.getElementById('totalCartPrice');
    if (!tbody) return;

    tbody.innerHTML = "";
    let grandTotal = 0;

    cartItems.forEach((item, index) => {
        const subtotal = item.hargaNum * item.qty;
        grandTotal += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.cover}" alt="${item.namaBarang}" style="width: 35px; height: 48px; object-fit: cover; border-radius: 3px; border: 1px solid #e2e8f0;">
                    <span>${item.namaBarang}</span>
                </div>
            </td>
            <td>${item.harga}</td>
            <td>
                <input type="number" min="1" value="${item.qty}" style="width: 50px; text-align: center;" onchange="updateQty(${index}, this.value)">
            </td>
            <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td><button class="btn btn-danger" style="padding: 2px 6px; font-size: 0.75rem;" onclick="removeCartItem(${index})">x</button></td>
        `;
        tbody.appendChild(tr);
    });

    if (totalEl) totalEl.innerText = 'Rp ' + grandTotal.toLocaleString('id-ID');
}

function updateQty(index, newQty) {
    const qty = parseInt(newQty);
    if (qty > 0) {
        cartItems[index].qty = qty;
        renderCartTable();
    }
}

function removeCartItem(index) {
    cartItems.splice(index, 1);
    renderCartTable();
}

function handleProcessCheckout(event) {
    event.preventDefault();
    if (cartItems.length === 0) {
        alert("Keranjang pemesanan kosong!");
        return;
    }
    const nama = document.getElementById('pemesanNama').value;
    const metode = document.getElementById('metodeBayar').value;

    alert("Terima kasih " + nama + "! Pesanan berhasil diproses (" + metode + ").\nNomor DO: 20230014");
    window.location.href = "tracking.html";
}

// 5. TRACKING LOGIC
function handleCariTracking(event) {
    event.preventDefault();
    const noDO = document.getElementById('inputNoDO').value.trim();
    const container = document.getElementById('resultTrackingContainer');
    const data = dataTracking[noDO];

    if (!data) {
        alert("Nomor Delivery Order tidak ditemukan! Gunakan contoh nomor DO: 20230012 atau 20230013");
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    document.getElementById('trackingDO').innerText = "Nomor Order: " + data.nomorDO;
    document.getElementById('trackingNama').innerText = "Nama Pemesan: " + data.nama;
    document.getElementById('detailEkspedisi').innerText = data.ekspedisi;
    document.getElementById('detailTanggal').innerText = data.tanggalKirim;
    document.getElementById('detailPaket').innerText = data.paket;
    document.getElementById('detailTotal').innerText = data.total;
    document.getElementById('detailStatus').innerText = data.status;

    const perList = document.getElementById('perjalananList');
    if (perList && data.perjalanan) {
        perList.innerHTML = data.perjalanan.map(p => `
            <tr>
                <td style="font-size: 0.85rem; width: 160px; color: #64748b;">${p.waktu}</td>
                <td style="font-size: 0.9rem;">${p.keterangan}</td>
            </tr>
        `).join('');
    }

    let statusStep = 1;
    if (data.status === "Dalam Perjalanan") statusStep = 3;
    else if (data.status === "Dikirim" || data.status === "Selesai") statusStep = 4;

    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById('step' + i);
        if (stepEl) {
            stepEl.classList.remove('active', 'completed');
            if (i < statusStep) stepEl.classList.add('completed');
            else if (i === statusStep) stepEl.classList.add('active');
        }
    }
}
