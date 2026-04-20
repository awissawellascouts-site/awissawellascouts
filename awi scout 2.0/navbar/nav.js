document.addEventListener("DOMContentLoaded", () => {
    const placeholder = document.getElementById("navbar-placeholder");
    if (!placeholder) return;

    const basePath = placeholder.getAttribute("data-base-path") || ".";

    fetch(`${basePath}/navbar/nav.html`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load nav bar");
            return res.text();
        })
        .then(data => {
            const html = data.replace(/\{BASE_PATH\}/g, basePath);
            placeholder.innerHTML = html;
            initNavbar();
        })
        .catch(e => console.error("Error loading navbar:", e));

    function initNavbar() {
        const hamburger = document.getElementById("hamburger");
        const navLinks = document.getElementById("nav-links");
        const header = document.getElementById("header");
        const utility = document.getElementById("utility");
        const mainNav = document.getElementById("main-nav");
        const darkModeToggle = document.getElementById("dark-mode-toggle");

        const isMobile = window.matchMedia("(max-width: 992px)");

        function closeMegaMenus() {
            document.querySelectorAll(".nav-links li").forEach(li => {
                li.classList.remove("mega-open");
            });
        }

        if (hamburger) {
            hamburger.addEventListener("click", () => {
                navLinks.classList.toggle("active");
                const icon = hamburger.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-bars");
                    icon.classList.toggle("fa-xmark");
                }
                if (!navLinks.classList.contains("active")) closeMegaMenus();
            });
        }

        if (navLinks) {
            navLinks.addEventListener("click", (e) => {
                if (!isMobile.matches) return;

                const link = e.target.closest("li > a");
                if (!link) return;

                const parentLi = link.parentElement;
                const megaBox = parentLi.querySelector(".mega-box");

                if (megaBox) {
                    e.preventDefault();
                    const isOpen = parentLi.classList.contains("mega-open");
                    closeMegaMenus();
                    if (!isOpen) {
                        parentLi.classList.add("mega-open");
                    }
                }
            });
        }

        document.addEventListener("click", (e) => {
            if (hamburger && !hamburger.contains(e.target) && navLinks && !navLinks.contains(e.target)) {
                navLinks.classList.remove("active");
                const icon = hamburger.querySelector("i");
                if (icon) {
                    icon.classList.add("fa-bars");
                    icon.classList.remove("fa-xmark");
                }
                closeMegaMenus();
            }
        });

        window.addEventListener("scroll", () => {
            const scrollY = window.scrollY;
            if (window.innerWidth > 992) {
                if (scrollY > 50) {
                    if (mainNav) mainNav.classList.add("shrunk");
                    if (header) header.classList.add("scrolled");
                    if (utility) utility.classList.add("scrolled-hide");
                } else {
                    if (mainNav) mainNav.classList.remove("shrunk");
                    if (header) header.classList.remove("scrolled");
                    if (utility) utility.classList.remove("scrolled-hide");
                }
            }
        });

    }
});
