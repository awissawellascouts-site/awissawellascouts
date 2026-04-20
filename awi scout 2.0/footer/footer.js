// Footer Loader & News Fetcher
(function () {
    const initFooter = () => {
        const placeholder = document.getElementById("footer-1");
        if (!placeholder) return;

        // Auto-detect base path based on script location
        const scriptTag = document.querySelector('script[src*="footer.js"]');
        const isSubDir = scriptTag && scriptTag.getAttribute('src').startsWith('..');
        const basePath = isSubDir ? ".." : ".";

        fetch(`${basePath}/footer/footer.html`)
            .then(res => {
                if (!res.ok) throw new Error("Footer not found at " + basePath);
                return res.text();
            })
            .then(data => {
                placeholder.innerHTML = data;
                startNewsPoll(isSubDir);
            })
            .catch(err => {
                console.warn("Footer path retry...", err);
                // Last ditch effort: try the other one
                const altPath = isSubDir ? "footer/footer.html" : "../footer/footer.html";
                fetch(altPath)
                    .then(res => res.text())
                    .then(data => {
                        placeholder.innerHTML = data;
                        startNewsPoll(!isSubDir);
                    });
            });
    };

    const startNewsPoll = (isSubDir) => {
        const checkDB = setInterval(async () => {
            if (window.DB && typeof window.DB.getCollection === 'function') {
                clearInterval(checkDB);
                renderNews(isSubDir);
            }
        }, 500);
        setTimeout(() => clearInterval(checkDB), 10000);
    };

    async function renderNews(isSubDir) {
        try {
            const news = await window.DB.getCollection('scout_news');
            const list = document.getElementById('footer-news-list');
            if (!list) return;

            if (!news || news.length === 0) {
                list.innerHTML = '<li style="border:none; color:#bdc3c7; font-size:13px;">No news headlines.</li>';
                return;
            }

            // Sort and take latest 3
            const latest = news.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

            const homeLink = isSubDir ? "../index.html" : "index.html";

            list.innerHTML = latest.map(n => `
                <li style="margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
                    <a href="${homeLink}" style="text-decoration:none; color:inherit; display:flex; align-items:flex-start; gap:10px;">
                        <i class="fas fa-newspaper" style="color:#f1c40f; margin-top:3px;"></i> 
                        <div>
                            <div style="font-size:13px; font-weight:500; color:white; line-height:1.3; margin-bottom:2px;">${n.title}</div>
                            <div style="font-size:10px; color:#f1c40f;">${n.date || ''}</div>
                        </div>
                    </a>
                </li>
            `).join('');
        } catch (e) {
            console.error("Footer news render error:", e);
        }
    }

    // Run immediately or on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initFooter);
    } else {
        initFooter();
    }
})();
