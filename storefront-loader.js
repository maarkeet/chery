(async function loadStorefrontFromSupabase() {
    const showLoadError = error => {
        console.error('Failed to load the storefront from Supabase', error);
        const message = 'تعذر تحميل بيانات المتجر الآن. حاولي تحديث الصفحة بعد قليل.';
        ['grid', 'featured', 'finderRes', 'catGrid'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = `<div class="empty">${message}</div>`;
        });
        const resultInfo = document.getElementById('resultInfo');
        if (resultInfo) resultInfo.textContent = 'تعذر تحميل المنتجات';
        const moreButton = document.getElementById('moreBtn');
        if (moreButton) moreButton.parentElement.style.display = 'none';
        const splash = document.getElementById('splash');
        if (splash) {
            splash.classList.add('out');
            setTimeout(() => splash.remove(), 900);
        }
    };

    try {
        const config = window.SUPABASE_CONFIG;
        if (!window.supabase?.createClient || !config?.url || !config?.publishableKey) {
            throw new Error('Supabase client configuration is missing');
        }

        const client = window.supabase.createClient(config.url, config.publishableKey);
        window.STORE_SUPABASE = client;

        const [productsResult, categoriesResult, settingsResult] = await Promise.all([
            client.from('products')
                .select('id,title,category,price,compare_at,badge,has_colors,sizes,variants,active,created_at')
                .eq('active', true)
                .order('created_at', { ascending: false }),
            client.from('categories')
                .select('slug,name,image_url,sort_order')
                .order('sort_order', { ascending: true }),
            client.from('store_settings')
                .select('key,value')
                .in('key', ['announcements', 'display'])
        ]);

        const failedRequest = [productsResult, categoriesResult, settingsResult]
            .find(result => result.error);
        if (failedRequest) throw failedRequest.error;

        const categories = (categoriesResult.data || []).filter(category => category.slug !== 'all');
        const categoryNames = new Map(categories.map(category => [category.slug, category.name]));
        categoryNames.set('all', 'الكل');
        window.STORE_CATEGORY_NAMES = categories.map(category => category.name);
        window.STORE_CATEGORY_IMAGES = Object.fromEntries(categories.map(category => [category.name, category.image_url || '']));

        const settings = Object.fromEntries(
            (settingsResult.data || []).map(setting => [setting.key, setting.value])
        );
        const display = settings.display && typeof settings.display === 'object' ? settings.display : {};
        display.whatsapp = display.whatsapp || '201224906360';
        display.phone = display.phone || '01224906360';
        const unavailableServiceCopy = /(?:شحن|توصيل|استلام|shipping|delivery)/i;
        if (unavailableServiceCopy.test(display.heroSubtitle || '') ||
            unavailableServiceCopy.test(display.shopHeading || '')) {
            display.heroSubtitle = 'وجهتك المتكاملة لكل مستلزمات الأم والبيبي من أول يوم 👶🏻';
            display.shopHeading = 'تشكيلة شيري مامي';
        }
        const announcements = Array.isArray(settings.announcements)
            ? settings.announcements.map(String).filter(text => !unavailableServiceCopy.test(text))
            : [];
        window.STORE_SETTINGS = {
            announcements: announcements.length ? announcements : [
                '🌸 قطن طبيعي ناعم على بشرتك',
                '🍒 اهتمام بالتفاصيل وحب في كل اختيار',
                '🤍 اختاري اللي يناسبك من شيري مامي'
            ],
            display
        };

        PRODUCTS.push(...(productsResult.data || []).map(product => {
            const id = Number(product.id);
            const price = Number(product.price);
            if (!Number.isSafeInteger(id) || !product.title || !Number.isFinite(price)) {
                throw new Error(`Invalid product data returned for product ${product.id}`);
            }
            return {
                id,
                name: product.title,
                cat: categoryNames.get(product.category) || product.category,
                price,
                max: product.compare_at === null ? null : Number(product.compare_at),
                badge: product.badge || '',
                hasColors: Boolean(product.has_colors),
                variants: Array.isArray(product.variants)
                    ? product.variants.map(variant => ({
                        name: String(variant?.name || ''),
                        hex: String(variant?.hex || '#F2B6C6'),
                        img: String(variant?.img || '')
                    }))
                    : [],
                sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : []
            };
        }));

        const script = document.createElement('script');
        script.src = './script.js';
        script.onerror = () => showLoadError(new Error('Could not load storefront interactions'));
        document.body.appendChild(script);
    } catch (error) {
        showLoadError(error);
    }
})();
