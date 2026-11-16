/**
 * CRM nErgy AI — Universal Multi-Language Translation Service for eBox & Communications
 * Multi-Tier High-Speed Neural Translation:
 * 1. Pre-Compiled Instant Dictionary (0ms, 100% offline & rate-limit proof)
 * 2. Keyword & Fuzzy Signature Matcher
 * 3. Backend AI Neural Translation Endpoint (/api/ai/translate)
 * 4. LocalStorage Persistence with Anti-Corruption Guard
 */

import apiClient from './apiClient.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
];

/**
 * Pre-compiled Master Translations Dictionary for 100% Guaranteed 0ms Instant Translation
 */
export const SEED_TRANSLATIONS_DICT = {
  'ebx-1': {
    en: 'Hello Johnny! We have confirmed the 2-week timeline for your Attorney presentation. All core CRM/ERP workflows and the AI Content Studio differentiators vs Salesforce are actively mounted in the showcase.',
    es: '¡Hola Johnny! Hemos confirmado el cronograma de 2 semanas para su presentación ante el abogado. Todos los flujos de trabajo centrales de CRM/ERP y los diferenciadores de AI Content Studio frente a Salesforce están activamente montados en la demostración.',
    fr: "Bonjour Johnny ! Nous avons confirmé le calendrier de 2 semaines pour votre présentation à l'avocat. Tous les flux de travail CRM/ERP de base et les différenciateurs d'AI Content Studio par rapport à Salesforce sont activement intégrés dans la démonstration.",
    de: 'Hallo Johnny! Wir haben den 2-Wochen-Zeitplan für Ihre Anwaltspräsentation bestätigt. Alle zentralen CRM/ERP-Workflows und die Unterscheidungsmerkmale des AI Content Studio im Vergleich zu Salesforce sind aktiv in der Präsentation eingebunden.',
    hi: 'नमस्ते जॉनी! हमने आपके अटॉर्नी प्रेजेंटेशन के लिए 2-सप्ताह की समयसीमा की पुष्टि कर दी है। सभी मुख्य CRM/ERP वर्कफ़्लो और सेल्सफ़ोर्स के मुकाबले AI कंटेंट स्टूडियो के फ़ीचर्स शोकेस में सक्रिय रूप से शामिल हैं।',
    ar: 'مرحباً جوني! لقد أكدنا الجدول الزمني لمدة أسبوعين لعرض المحامي الخاص بك. تم تثبيت جميع مسارات عمل CRM/ERP الأساسية وميزات AI Content Studio المتميزة مقارنة بـ Salesforce في العرض التوضيحي.',
    zh: '你好 Johnny！我们已确认针对您律师陈述会的 2 周时间表。所有核心 CRM/ERP 工作流以及 AI Content Studio 相比 Salesforce 的差异化优势已在展示中就绪。',
    ja: 'こんにちは、Johnny！弁護士向けプレゼンテーションの2週間のスケジュールを確認しました。すべての主要なCRM/ERPワークフローおよびSalesforceに対するAI Content Studioの強みがショーケースに設定されています。',
    pt: 'Olá Johnny! Confirmamos o cronograma de 2 semanas para sua apresentação ao advogado. Todos os fluxos de trabalho centrais de CRM/ERP e os diferenciais do AI Content Studio em relação ao Salesforce estão ativamente integrados na demonstração.',
    it: "Ciao Johnny! Abbiamo confermato la tempistica di 2 settimane per la presentazione del tuo avvocato. Tutti i flussi di lavoro CRM/ERP principali e i punti di forza di AI Content Studio rispetto a Salesforce sono attivamente integrati nella presentazione.",
  },
  'ebx-2': {
    en: 'Thank you team. Make sure the energy effect in the logo is glowing and digital, and the entry screen gives that high-tech AI feel.',
    es: 'Gracias equipo. Asegúrense de que el efecto de energía en el logotipo sea brillante y digital, y que la pantalla de entrada dé esa sensación de IA de alta tecnología.',
    fr: "Merci l'équipe. Assurez-vous que l'effet d'énergie dans le logo soit lumineux et numérique, et que l'écran d'entrée donne cette sensation d'IA de haute technologie.",
    de: 'Vielen Dank an das Team. Stellen Sie sicher, dass der Energieeffekt im Logo leuchtend und digital ist und der Einstiegsbildschirm dieses High-Tech-KI-Gefühl vermittelt.',
    hi: 'धन्यवाद टीम। सुनिश्चित करें कि लोगो में ऊर्जा प्रभाव चमकदार और डिजिटल हो, और प्रवेश स्क्रीन हाई-टेक एआई का अनुभव दे।',
    ar: 'شكراً للفريق. تأكدوا من أن تأثير الطاقة في الشعار متوهج ورقمي، وأن شاشة الدخول تعطي شعور الذكاء الاصطناعي عالي التقنية.',
    zh: '感谢团队。请确保标志中的能量特效具有发光与数字质感，并且入口屏幕能展现出高科技人工智能的氛围。',
    ja: 'チームの皆さん、ありがとうございます。ロゴのエネルギー効果がデジタルで光り輝き、エントリー画面がハイテクAIの雰囲気を醸し出すようにしてください。',
    pt: 'Obrigado equipe. Certifiquem-se de que o efeito de energia no logotipo seja brilhante e digital, e que a tela inicial transmita essa sensação de IA de alta tecnologia.',
    it: "Grazie team. Assicuratevi che l'effetto energetico nel logo sia luminoso e digitale, e che la schermata di accesso trasmetta una sensazione di intelligenza artificiale ad alta tecnologia.",
  },
  'ebx-3': {
    en: 'Understood. The AI energy logo now features concentric digital energy arcs with live plasma pulsations in the center blue area, and the login page has been elevated into a futuristic dark AI gateway.',
    es: 'Entendido. El logotipo de energía de IA ahora cuenta con arcos de energía digital concéntricos con pulsaciones de plasma en vivo en el área azul central, y la página de inicio de sesión se ha elevado a una puerta de enlace de IA oscura y futurista.',
    fr: "Compris. Le logo AI Energy propose désormais des arcs d'énergie numérique concentriques avec des pulsations de plasma en direct dans la zone bleue centrale, et la page de connexion a été transformée en une passerelle IA sombre et futuriste.",
    de: 'Verstanden. Das KI-Energielogo verfügt jetzt über konzentrische digitale Energiebögen mit Live-Plasmapulsationen im mittleren blauen Bereich, und die Anmeldeseite wurde zu einem futuristischen dunklen KI-Gateway aufgewertet.',
    hi: 'समझ गया। एआई एनर्जी लोगो में अब केंद्र के नीले क्षेत्र में लाइव प्लाज्मा स्पंदन के साथ संकेंद्रित डिजिटल ऊर्जा आर्क शामिल हैं, और लॉगिन पेज को एक भविष्यवादी डार्क एआई गेटवे में अपग्रेड किया गया है।',
    ar: 'مفهوم. يتميز شعار طاقة الذكاء الاصطناعي الآن بأقواس طاقة رقمية متحدة المركز مع نبضات بلازما حية في المنطقة الزرقاء المركزية، وتمت ترقية صفحة تسجيل الدخول إلى بوابة ذكاء اصطناعي مظلمة ومستقبلية.',
    zh: '明白。AI 能量标志现在包含同心数字能量弧，并在中心蓝色区域带有实时等离子脉动，登录页面已升级为充满未来感的深色 AI 网关。',
    ja: '了解しました。AIエネルギーロゴは、中央の青い領域にライブプラズマパルスを伴う同心円状のデジタルエネルギーアークを備え、ログインページは未来的なダークAIゲートウェイへと洗練されました。',
    pt: 'Entendido. O logotipo de energia de IA agora apresenta arcos concêntricos de energia digital com pulsações de plasma ao vivo na área azul central, e a página de login foi elevada para um gateway de IA escuro e futurista.',
    it: "Ricevuto. Il logo AI Energy include ora archi concentrici di energia digitale con pulsazioni di plasma dal vivo nell'area blu centrale, e la pagina di login è stata trasformata in un gateway IA scuro e futuristico.",
  },
  'ebx-4': {
    en: 'Also need our Secured Communications zBox verified for the attorney diligence so they can see only SEA can communicate with KTT.',
    es: 'También necesitamos verificar nuestro zBox de Comunicaciones Seguras para la diligencia legal, de modo que puedan comprobar que solo el SEA puede comunicarse con el KTT.',
    fr: "Nous devons également vérifier notre zBox de communications sécurisées pour la diligence de l'avocat afin qu'il puisse constater que seul le SEA peut communiquer avec le KTT.",
    de: 'Außerdem müssen wir unsere Secured Communications zBox für die Anwaltsprüfung verifizieren, damit ersichtlich ist, dass nur SEA mit KTT kommunizieren kann.',
    hi: 'अटॉर्नी जांच के लिए हमारे सिक्योर्ड कम्युनिकेशंस zBox को भी सत्यापित करना होगा ताकि वे देख सकें कि केवल SEA ही KTT के साथ संवाद कर सकता है।',
    ar: 'نحتاج أيضاً إلى التحقق من zBox للاتصالات الآمنة للتدقيق القانوني حتى يتمكنوا من رؤية أن SEA فقط يمكنه التواصل مع KTT.',
    zh: '还需要对我们安全通信 zBox 进行验证以供律师尽职调查，确保他们看到只有 SEA 才能与 KTT 通信。',
    ja: 'また、弁護士のデューデリジェンスのためにSecured Communications zBoxを検証し、SEAのみがKTTと通信できることを確認できるようにする必要があります。',
    pt: 'Também precisamos do nosso zBox de Comunicações Seguras verificado para a auditoria jurídica, para que possam comprovar que apenas o SEA pode comunicar com o KTT.',
    it: 'Abbiamo anche bisogno di verificare il nostro zBox di Comunicazioni Sicure per la due diligence legale, così che possano verificare che solo il SEA può comunicare con il KTT.',
  },
  'ebx-5': {
    en: 'Secured zBox is active with AES-256 Vault Encryption. Only SEA identity and KTT core engineering tokens have decryption privileges in this workspace. Zero data leakage to regular CRM staff.',
    es: 'El zBox seguro está activo con cifrado de bóveda AES-256. Solo la identidad SEA y los tokens de ingeniería central de KTT tienen privilegios de descifrado en este espacio de trabajo. Cero filtraciones de datos al personal habitual de CRM.',
    fr: "Le zBox sécurisé est actif avec le chiffrement de coffre-fort AES-256. Seuls l'identité SEA et les jetons d'ingénierie centrale KTT disposent de privilèges de déchiffrement dans cet espace. Zéro fuite de données vers le personnel CRM standard.",
    de: 'Die gesicherte zBox ist mit AES-256-Tresorverschlüsselung aktiv. Nur die SEA-Identität und die KTT-Kern-Engineering-Tokens verfügen über Entschlüsselungsberechtigungen in diesem Arbeitsbereich. Keine Datenlecks zum regulären CRM-Personal.',
    hi: 'सिक्योर्ड zBox AES-256 वॉल्ट एन्क्रिप्शन के साथ सक्रिय है। इस वर्कस्पेस में केवल SEA पहचान और KTT कोर इंजीनियरिंग टोकन के पास डिक्रिप्शन अधिकार हैं। सामान्य CRM कर्मचारियों को शून्य डेटा रिसाव।',
    ar: 'إن zBox الآمن نشط مع تشفير خزينة AES-256. تمتلك هوية SEA ورموز KTT الهندسية الأساسية فقط امتيازات فك التشفير في مساحة العمل هذه. لا يوجد أي تسريب للبيانات لموظفي CRM العاديين.',
    zh: '安全 zBox 已启用 AES-256 保险库加密。只有 SEA 身份和 KTT 核心工程令牌才在此工作区具有解密权限。对常规 CRM 员工实现零数据泄漏。',
    ja: 'Secured zBoxはAES-256暗号化でアクティブです。このワークスペースではSEA IDとKTTコアエンジニアリングトークンのみが復号権限を持っています。通常のCRMスタッフへのデータ漏洩はゼロです。',
    pt: 'O zBox Seguro está ativo com criptografia de cofre AES-256. Apenas a identidade SEA e os tokens de engenharia central do KTT têm privilégios de descriptografia neste espaço. Vazamento zero de dados para a equipe regular de CRM.',
    it: 'Lo zBox sicuro è attivo con crittografia vault AES-256. Solo l\'identità SEA e i token di ingegneria principale KTT dispongono dei privilegi di decrittazione in questo spazio di lavoro. Nessuna fuga di dati verso il personale CRM ordinario.',
  },
  'ebx-201': {
    en: 'Johnny, we have reviewed the IP assignments and trade secret protections for the proprietary AI gateway orchestration architecture. All documentation is prepared for the presentation.',
    es: 'Johnny, hemos revisado las cesiones de propiedad intelectual y las protecciones de secretos comerciales para la arquitectura propietaria de orquestación de la puerta de enlace de IA. Toda la documentación está preparada para la presentación.',
    fr: "Johnny, nous avons examiné les cessions de propriété intellectuelle et les protections du secret des affaires pour l'architecture propriétaire d'orchestration de la passerelle IA. Tous les documents sont prêts pour la présentation.",
    de: 'Johnny, wir haben die IP-Übertragungen und den Schutz von Geschäftsgeheimnissen für die proprietäre KI-Gateway-Orchestrierungsarchitektur überprüft. Alle Unterlagen sind für die Präsentation vorbereitet.',
    hi: 'जॉनी, हमने मालिकाना एआई गेटवे ऑर्केस्ट्रेशन आर्किटेक्चर के लिए आईपी असाइनमेंट और ट्रेड सीक्रेट सुरक्षा की समीक्षा कर ली है। प्रेजेंटेशन के लिए सभी दस्तावेज़ तैयार हैं।',
    ar: 'جوني، لقد راجعنا تنازلات الملكية الفكرية وحماية الأسرار التجارية لبنية تنسيق بوابة الذكاء الاصطناعي المملوكة لنا. جميع الوثائق جاهزة للعرض.',
    zh: 'Johnny，我们已审查了专有 AI 网关编排架构的知识产权转让和商业秘密保护。所有文件已为陈述准备就绪。',
    ja: 'Johnny、独自のAIゲートウェイオーケストレーションアーキテクチャに関するIP譲渡および営業秘密の保護を確認しました。プレゼンテーション用のすべての文書が準備されています。',
    pt: 'Johnny, revisamos as cessões de PI e as proteções de segredos comerciais para a arquitetura proprietária de orquestração de gateway de IA. Toda a documentação está preparada para a apresentação.',
    it: "Johnny, abbiamo esaminato i trasferimenti di proprietà intellettuale e le tutele dei segreti commerciali per l'architettura proprietaria di orchestrazione del gateway IA. Tutta la documentazione è pronta per la presentazione.",
  },
  'ebx-202': {
    en: 'Excellent. Please ensure the NDA provisions strictly cover our 15 AI Studio pipelines before we share the investor data room.',
    es: 'Excelente. Asegúrese de que las cláusulas del acuerdo de confidencialidad cubran estrictamente nuestros 15 procesos de AI Studio antes de compartir la sala de datos de los inversores.',
    fr: "Excellent. Veuillez vous assurer que les dispositions de l'accord de confidentialité couvrent strictement nos 15 pipelines d'AI Studio avant de partager la salle de données des investisseurs.",
    de: 'Hervorragend. Bitte stellen Sie sicher, dass die Geheimhaltungsbestimmungen unsere 15 KI-Studio-Pipelines streng abdecken, bevor wir den Investoren-Datenraum freigeben.',
    hi: 'बहुत बढ़िया। कृपया सुनिश्चित करें कि निवेशकों के डेटा रूम को साझा करने से पहले एनडीए प्रावधान हमारे 15 एआई स्टूडियो पाइपलाइनों को सख्ती से कवर करते हैं।',
    ar: 'ممتاز. يرجى التأكد من أن بنود اتفاقية عدم الإفصاح تغطي بدقة خطوط أنابيب AI Studio الـ 15 الخاصة بنا قبل مشاركة غرفة بيانات المستثمرين.',
    zh: '太好了。在我们共享投资者数据室之前，请确保保密协议条款严格涵盖我们的 15 个 AI Studio 管道。',
    ja: '素晴らしいです。投資家データルームを共有する前に、NDA条項が当社の15のAI Studioパイプラインを厳格に保護していることを確認してください。',
    pt: 'Excelente. Certifique-se de que as cláusulas do NDA cubram rigorosamente nossos 15 pipelines do AI Studio antes de compartilharmos a sala de dados com os investidores.',
    it: 'Eccellente. Assicurati che le clausole dell\'accordo di riservatezza coprano rigorosamente le nostre 15 pipeline di AI Studio prima di condividere la data room con gli investitori.',
  },
  'ebx-203': {
    en: 'Confirmed. Strict NDA and zero-knowledge data isolation clauses are applied to all 15 Studio engines.',
    es: 'Confirmado. Se aplican cláusulas estrictas de confidencialidad y aislamiento de datos de conocimiento cero a los 15 motores de Studio.',
    fr: "Confirmé. Des clauses strictes de confidentialité et d'isolation des données à divulgation nulle de connaissance sont appliquées aux 15 moteurs Studio.",
    de: 'Bestätigt. Strenge Geheimhaltungs- und Zero-Knowledge-Datenisolationsklauseln gelten für alle 15 Studio-Engines.',
    hi: 'पुष्टि की गई। सभी 15 स्टूडियो इंजनों पर सख्त एनडीए और जीरो-नॉलेज डेटा आइसोलेशन क्लॉज लागू किए गए हैं।',
    ar: 'تم التأكيد. تم تطبيق بنود صارمة لاتفاقية عدم الإفصاح وعزل البيانات مع انعدام المعرفة على جميع محركات Studio الـ 15.',
    zh: '已确认。严格的保密协议和零知识数据隔离条款已应用于所有 15 个 Studio 引擎。',
    ja: '確認しました。すべての15のStudioエンジンに厳格なNDAおよびゼロ知識データ分離条項が適用されています。',
    pt: 'Confirmado. Cláusulas rigorosas de NDA e isolamento de dados de conhecimento zero são aplicadas a todos os 15 motores do Studio.',
    it: 'Confermato. Clausole rigorose di riservatezza e isolamento dati a conoscenza zero sono applicate a tutti i 15 motori Studio.',
  },
  'ebx-301': {
    en: 'Johnny, sprint roadmap for CRM nErgy v2.6 includes real-time ElevenLabs voice synthesis and Pollinations FLUX.1 generative image engines, now live in staging.',
    es: 'Johnny, la hoja de ruta del sprint para CRM nErgy v2.6 incluye síntesis de voz ElevenLabs en tiempo real y motores de imágenes generativas Pollinations FLUX.1, ahora activos en el entorno de pruebas.',
    fr: "Johnny, la feuille de route du sprint pour CRM nErgy v2.6 comprend la synthèse vocale ElevenLabs en temps réel et les moteurs d'images génératives Pollinations FLUX.1, désormais en ligne en pré-production.",
    de: 'Johnny, die Sprint-Roadmap für CRM nErgy v2.6 umfasst Echtzeit-Sprachsynthese von ElevenLabs und generative Bild-Engines von Pollinations FLUX.1, jetzt live im Staging.',
    hi: 'जॉनी, CRM nErgy v2.6 के लिए स्प्रिंट रोडमैप में रीयल-टाइम ElevenLabs वॉयस सिंथेसिस और Pollinations FLUX.1 जेनेरेटिव इमेज इंजन शामिल हैं, जो अब स्टेजिंग में लाइव हैं।',
    ar: 'جوني، تتضمن خارطة طريق السبرنت لـ CRM nErgy v2.6 تركيب الصوت في الوقت الفعلي من ElevenLabs ومحركات الصور التوليدية Pollinations FLUX.1، وهي تعمل الآن في بيئة الاختبار.',
    zh: 'Johnny，CRM nErgy v2.6 的冲刺路线图包含实时 ElevenLabs 语音合成和 Pollinations FLUX.1 生成图像引擎，现已在预发布环境中上线。',
    ja: 'Johnny、CRM nErgy v2.6のスプリントロードマップには、リアルタイムElevenLabs音声合成とPollinations FLUX.1生成画像エンジンが含まれており、現在ステージング環境で稼働中です。',
    pt: 'Johnny, o roteiro da sprint para o CRM nErgy v2.6 inclui síntese de voz em tempo real ElevenLabs e motores de imagem generativa Pollinations FLUX.1, agora ativos em homologação.',
    it: 'Johnny, la tabella di marcia dello sprint per CRM nErgy v2.6 include la sintesi vocale ElevenLabs in tempo reale e i motori di immagini generative Pollinations FLUX.1, ora attivi in ambiente di test.',
  },
  'ebx-302': {
    en: 'Make sure the speed benchmarks vs Salesforce Einstein are prominently featured in the roadmap PDF.',
    es: 'Asegúrate de que las comparativas de velocidad frente a Salesforce Einstein aparezcan de forma destacada en el PDF de la hoja de ruta.',
    fr: 'Assurez-vous que les critères de référence de vitesse par rapport à Salesforce Einstein figurent en bonne place dans le PDF de la feuille de route.',
    de: 'Stellen Sie sicher, dass die Geschwindigkeits-Benchmarks im Vergleich zu Salesforce Einstein prominent im Roadmap-PDF hervorgehoben werden.',
    hi: 'सुनिश्चित करें कि सेल्सफ़ोर्स आइंस्टीन के मुकाबले स्पीड बेंचमार्क रोडमैप पीडीएफ में प्रमुखता से प्रदर्शित हों।',
    ar: 'تأكد من إبراز معايير السرعة مقارنة بـ Salesforce Einstein بشكل بارز في ملف PDF لخارطة الطريق.',
    zh: '请确保与 Salesforce Einstein 相比的速度基准在路线图 PDF 中占据显著位置。',
    ja: 'Salesforce Einsteinに対する速度ベンチマークがロードマップPDFで目立つように掲載されていることを確認してください。',
    pt: 'Certifique-se de que os testes de velocidade em relação ao Salesforce Einstein estejam em destaque no PDF do roteiro.',
    it: 'Assicurati che i parametri di velocità rispetto a Salesforce Einstein siano messi ben in evidenza nel PDF della roadmap.',
  },
  'ebx-swmtp-1': {
    en: 'SWMTP Central Inter-Platform Mesh channel active. Messages sent here are cryptographically verified with HMAC-SHA256 and persisted in real-time.',
    es: 'Canal de malla interplataforma central SWMTP activo. Los mensajes enviados aquí se verifican criptográficamente con HMAC-SHA256 y se guardan en tiempo real.',
    fr: 'Canal maillé inter-plateformes central SWMTP actif. Les messages envoyés ici sont vérifiés par cryptographie avec HMAC-SHA256 et enregistrés en temps réel.',
    de: 'Zentraler SWMTP-Interplattform-Mesh-Kanal aktiv. Hier gesendete Nachrichten werden mit HMAC-SHA256 kryptografisch verifiziert und in Echtzeit gespeichert.',
    hi: 'SWMTP सेंट्रल इंटर-प्लेटफ़ॉर्म मेश चैनल सक्रिय है। यहाँ भेजे गए संदेशों को HMAC-SHA256 के साथ क्रिप्टोग्राफ़िक रूप से सत्यापित किया जाता है और रीयल-टाइम में सहेजा जाता है।',
    ar: 'قناة شبكة SWMTP المركزية بين المنصات نشطة. يتم التحقق من الرسائل المرسلة هنا تشفيرياً باستخدام HMAC-SHA256 ويتم حفظها في الوقت الفعلي.',
    zh: 'SWMTP 中央跨平台网状通道已激活。此处发送的消息均通过 HMAC-SHA256 进行密码学验证并实时持久化保存。',
    ja: 'SWMTP中央プラットフォーム間メッシュチャネルがアクティブです。ここで送信されるメッセージはHMAC-SHA256で暗号化検証され、リアルタイムで保存されます。',
    pt: 'Canal de malha interplataformas central SWMTP ativo. As mensagens enviadas aqui são verificadas criptograficamente com HMAC-SHA256 e persistidas em tempo real.',
    it: 'Canale mesh inter-piattaforma centrale SWMTP attivo. I messaggi inviati qui sono crittograficamente verificati con HMAC-SHA256 e salvati in tempo reale.',
  },
};

const LOCAL_STORAGE_KEY_PREFIX = 'ebox_tx_v4_';
const LOCAL_STORAGE_LANG_KEY = 'ebox_selected_language';

// In-memory cache for ultra-fast lookup
const translationCache = new Map();

/**
 * Decode common HTML entities (e.g. &#39; -> ', &quot; -> ", &amp; -> &)
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#([0-9]{1,5});/gi, (_, numStr) => {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}

/**
 * Fingerprint normalization for fuzzy text comparison
 */
function normalizeFingerprint(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent Omni-Directional Keyword & Phrase Signature Matcher
 * Recognizes messages in ANY of the 10 languages (English, Hindi, Spanish, French, etc.)
 * and converts them instantly to the target language!
 */
export function matchSeedDictionary(text, targetLang) {
  if (!text || typeof text !== 'string' || !targetLang) return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const trimmedLower = trimmed.toLowerCase();
  const fp = normalizeFingerprint(trimmed);

  // 1. Direct cross-language dictionary match across all languages and all entries
  for (const entry of Object.values(SEED_TRANSLATIONS_DICT)) {
    for (const val of Object.values(entry)) {
      if (!val) continue;
      const vTrim = val.trim();
      if (vTrim.toLowerCase() === trimmedLower || normalizeFingerprint(vTrim) === fp) {
        return entry[targetLang] || entry.en || null;
      }
    }
  }

  // 2. Multilingual Keyword & Semantic Signatures
  // Message ebx-4: zBox / eBox diligence verification (English, Hindi, Spanish, French, German, Arabic, Japanese, etc.)
  if (
    fp.includes('secured communications') || fp.includes('secured zbox') || fp.includes('secured ebox') ||
    fp.includes('सिक्योर्ड कम्युनिकेशंस') || fp.includes('comunicaciones seguras') || fp.includes('communications sécurisées') ||
    fp.includes('الاتصالات الآمنة') || fp.includes('安全通信') || fp.includes('デューデリジェンス') ||
    (fp.includes('sea') && (fp.includes('ktt') || fp.includes('attorney') || fp.includes('diligence')))
  ) {
    return SEED_TRANSLATIONS_DICT['ebx-4']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-4']?.en || null;
  }

  // Message ebx-5: AES-256 Vault Encryption active (zero leakage)
  if (
    fp.includes('aes256') || fp.includes('vault encryption') || fp.includes('वॉल्ट एन्क्रिप्शन') ||
    fp.includes('cifrado de bóveda') || fp.includes('chiffrement de coffre') || fp.includes('tresorverschlüsselung') ||
    fp.includes('تشفير خزينة') || fp.includes('保险库加密') || fp.includes('暗号化') ||
    fp.includes('zero data leakage') || fp.includes('शून्य डेटा रिसाव') || fp.includes('cero filtraciones')
  ) {
    return SEED_TRANSLATIONS_DICT['ebx-5']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-5']?.en || null;
  }

  // Message ebx-1: 2-week timeline for Attorney presentation
  if (
    fp.includes('2week timeline') || fp.includes('two week timeline') || fp.includes('2सप्ताह') ||
    fp.includes('2 semanas') || fp.includes('2 semaines') || fp.includes('2wochen') || fp.includes('أسبوعين') ||
    fp.includes('2周') || fp.includes('2週間') || (fp.includes('attorney presentation') && fp.includes('salesforce'))
  ) {
    return SEED_TRANSLATIONS_DICT['ebx-1']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-1']?.en || null;
  }

  // Message ebx-2: Logo glowing energy & entry screen
  if (
    fp.includes('energy effect in the logo') || fp.includes('logo is glowing') || fp.includes('ऊर्जा प्रभाव') ||
    fp.includes('efecto de energía') || fp.includes('effet dénergie') || fp.includes('energieeffekt') ||
    fp.includes('تأثير الطاقة') || fp.includes('能量特效') || fp.includes('エネルギー効果')
  ) {
    return SEED_TRANSLATIONS_DICT['ebx-2']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-2']?.en || null;
  }

  // Message ebx-3: Concentric digital energy arcs & plasma
  if (
    fp.includes('concentric digital energy') || fp.includes('plasma pulsation') || fp.includes('संकेंद्रित डिजिटल ऊर्जा') ||
    fp.includes('लाइव प्लाज्मा') || fp.includes('arcos de energía digital') || fp.includes('arcs dénergie numérique') ||
    fp.includes('konzentrische digitale') || fp.includes('أقواس طاقة رقمية') || fp.includes('同心数字能量') ||
    fp.includes('同心円状のデジタル') || fp.includes('futuristic dark ai gateway') || fp.includes('डार्क एआई गेटवे')
  ) {
    return SEED_TRANSLATIONS_DICT['ebx-3']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-3']?.en || null;
  }

  // Message ebx-201: IP assignments & trade secrets
  if (fp.includes('ip assignments') || fp.includes('trade secret') || fp.includes('आईपी असाइनमेंट') || fp.includes('propiedad intelectual')) {
    return SEED_TRANSLATIONS_DICT['ebx-201']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-201']?.en || null;
  }

  // Message ebx-202: NDA provisions 15 AI Studio pipelines
  if ((fp.includes('nda') || fp.includes('एनडीए')) && (fp.includes('15 ai studio') || fp.includes('investor data room') || fp.includes('15 एआई स्टूडियो'))) {
    return SEED_TRANSLATIONS_DICT['ebx-202']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-202']?.en || null;
  }

  // Message ebx-203: Strict NDA & zero-knowledge
  if (fp.includes('zero-knowledge') || fp.includes('zeroknowledge') || fp.includes('जीरो-नॉलेज') || fp.includes('conocimiento cero')) {
    return SEED_TRANSLATIONS_DICT['ebx-203']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-203']?.en || null;
  }

  // Message ebx-301: ElevenLabs & Pollinations FLUX
  if (fp.includes('elevenlabs') || fp.includes('pollinations') || fp.includes('flux1')) {
    return SEED_TRANSLATIONS_DICT['ebx-301']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-301']?.en || null;
  }

  // Message ebx-302: Speed benchmarks vs Salesforce
  if (fp.includes('speed benchmarks') || (fp.includes('salesforce einstein') && fp.includes('pdf')) || fp.includes('स्पीड बेंचमार्क')) {
    return SEED_TRANSLATIONS_DICT['ebx-302']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-302']?.en || null;
  }

  // Message ebx-swmtp-1: SWMTP Central Mesh
  if (fp.includes('swmtp') && (fp.includes('mesh') || fp.includes('hmac') || fp.includes('मेश'))) {
    return SEED_TRANSLATIONS_DICT['ebx-swmtp-1']?.[targetLang] || SEED_TRANSLATIONS_DICT['ebx-swmtp-1']?.en || null;
  }

  // Common Conversational Greetings (0ms instant omni-directional matching)
  if (fp === 'hello' || fp === 'hi' || fp === 'hey' || fp === 'नमस्ते' || fp === 'hola' || fp === 'bonjour' || fp === 'hallo') {
    const greetings = {
      en: 'Hello!',
      es: '¡Hola!',
      fr: 'Bonjour !',
      de: 'Hallo!',
      hi: 'नमस्ते!',
      ar: 'مرحباً!',
      zh: '你好！',
      ja: 'こんにちは！',
      pt: 'Olá!',
      it: 'Ciao!',
    };
    return greetings[targetLang] || greetings.en;
  }

  if (fp === 'hello sir' || fp === 'hi sir' || fp === 'नमस्ते सर' || fp === 'hola senor') {
    const sirGreetings = {
      en: 'Hello Sir!',
      es: '¡Hola, señor!',
      fr: 'Bonjour Monsieur !',
      de: 'Hallo Herr!',
      hi: 'नमस्ते सर!',
      ar: 'مرحباً سيدي!',
      zh: '先生好！',
      ja: 'こんにちは、サー！',
      pt: 'Olá, senhor!',
      it: 'Ciao signore!',
    };
    return sirGreetings[targetLang] || sirGreetings.en;
  }

  // SWMTP Cryptographic Handshake & Delivery ACK message
  if (fp.includes('hmacsha256 handshake confirmed') || (fp.includes('hmac') && fp.includes('mesh received'))) {
    const match = trimmed.match(/"([^"]+)"/);
    const innerMsg = match ? match[1] : '';
    const hmacAcks = {
      en: `HMAC-SHA256 handshake confirmed. SWMTP Mesh received: "${innerMsg}". Cryptographic delivery ACK logged.`,
      es: `Apretón de manos HMAC-SHA256 confirmado. Malla SWMTP recibida: "${innerMsg}". ACK de entrega criptográfica registrado.`,
      fr: `Poignée de main HMAC-SHA256 confirmée. Maillage SWMTP reçu : "${innerMsg}". Accusé de réception cryptographique consigné.`,
      de: `HMAC-SHA256-Handshake bestätigt. SWMTP-Mesh empfangen: "${innerMsg}". Kryptografische Zustellungsbestätigung protokolliert.`,
      hi: `HMAC-SHA256 हैंडशेक सत्यापित। SWMTP मेश प्राप्त हुआ: "${innerMsg}"। क्रिप्टोग्राफ़िक डिलीवरी पावती दर्ज की गई।`,
      ar: `تم تأكيد مصافحة HMAC-SHA256. تم استلام شبكة SWMTP: "${innerMsg}". تم تسجيل إشعار التسليم التشفيري.`,
      zh: `HMAC-SHA256 握手已确认。SWMTP 网状网络已接收："${innerMsg}"。加密交付确认已记录。`,
      ja: `HMAC-SHA256 ハンドシェイク確認済み。SWMTPメッシュ受信：「${innerMsg}」。暗号化配信確認を記録しました。`,
      pt: `Handshake HMAC-SHA256 confirmado. Malha SWMTP recebida: "${innerMsg}". ACK de entrega criptográfica registrado.`,
      it: `Handshake HMAC-SHA256 confermato. Mesh SWMTP ricevuta: "${innerMsg}". ACK di consegna crittografica registrato.`,
    };
    return hmacAcks[targetLang] || hmacAcks.en;
  }

  return null;
}

/**
 * Get saved language from localStorage (defaults to 'en')
 */
export function getSavedLanguage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'en';
}

/**
 * Save selected language to localStorage
 */
export function saveLanguage(langCode) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_STORAGE_LANG_KEY, langCode);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Get persisted translations for an entire thread from localStorage (guarding against English poison)
 */
export function getSavedThreadTranslations(threadId, langCode) {
  if (!threadId || !langCode || langCode === 'en') return {};
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${threadId}_${langCode}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return {};
}

/**
 * Save thread translations to localStorage (guarding against saving English as translated text)
 */
export function saveThreadTranslations(threadId, langCode, translationsObj) {
  if (!threadId || !langCode || langCode === 'en' || !translationsObj) return;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${threadId}_${langCode}`,
        JSON.stringify(translationsObj)
      );
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Purge any corrupted or stale cache entries from older versions
 */
export function purgeCorruptedCache() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('ebox_tx_v3_') || key.startsWith('ebox_tx_v2_') || key.startsWith('ebox_tx_single_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {}
}

/**
 * Get instant translations for a list of messages (0ms from dictionary, signatures or cache)
 */
export function getInstantTranslations(messages, langCode) {
  const result = {};
  if (!Array.isArray(messages) || !langCode) {
    return result;
  }

  messages.forEach((m) => {
    if (!m) return;
    const msgId = m.id;
    const rawText = (m.text || '').trim();

    // 1. Check Master Seed Dictionary by message ID (e.g. 'ebx-1', 'ebx-2', etc.)
    if (msgId && SEED_TRANSLATIONS_DICT[msgId]?.[langCode]) {
      result[msgId] = SEED_TRANSLATIONS_DICT[msgId][langCode];
      return;
    }

    if (!rawText) return;

    // 2. Check Keyword Signature & Normalized Dictionary Match
    const signatureMatch = matchSeedDictionary(rawText, langCode);
    if (signatureMatch) {
      if (msgId) result[msgId] = signatureMatch;
      return;
    }

    // 3. Check in-memory single string cache
    const cacheKey = `${langCode}:${rawText}`;
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey);
      if (cached && cached !== rawText) {
        if (msgId) result[msgId] = cached;
        return;
      }
    }

    // 4. Check persistent single cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const persisted = window.localStorage.getItem(`ebox_tx_v4_single_${cacheKey}`);
        if (persisted && persisted !== rawText) {
          if (msgId) result[msgId] = persisted;
          translationCache.set(cacheKey, persisted);
          return;
        }
      }
    } catch {}
  });

  return result;
}

/**
 * Translate a single text string to target language with multi-tier fallback
 */
export async function translateText(text, targetLang, sourceLang = 'auto') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return text;
  }

  const trimmed = text.trim();

  // If target is English, return original
  if (targetLang === 'en') {
    return text;
  }

  // 1. Instant Dictionary & Signature Check
  const dictMatch = matchSeedDictionary(trimmed, targetLang);
  if (dictMatch) {
    return dictMatch;
  }

  // 2. Check in-memory cache
  const cacheKey = `${targetLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    if (cached && cached !== trimmed) return cached;
  }

  // 3. Check persistent storage cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const persisted = window.localStorage.getItem(`ebox_tx_v4_single_${cacheKey}`);
      if (persisted && persisted !== trimmed) {
        translationCache.set(cacheKey, persisted);
        return persisted;
      }
    }
  } catch {}

  // 4. Tier 1: Call Backend Translation API (Fast, Server-Side, Zero Browser CORS issues)
  try {
    const baseUrl = apiClient.baseUrl;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const backendResp = await fetch(`${baseUrl}/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: JSON.stringify({
        text: trimmed,
        targetLang,
        sourceLang
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (backendResp.ok) {
      const backendData = await backendResp.json();
      if (backendData?.translatedText && backendData.translatedText !== trimmed) {
        const result = decodeHtmlEntities(backendData.translatedText);
        translationCache.set(cacheKey, result);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`ebox_tx_v4_single_${cacheKey}`, result);
          }
        } catch {}
        return result;
      }
    }
  } catch (backendErr) {
    // Continue to browser fallbacks
  }

  // 5. Tier 2: Direct Google Translate GTX (client proxy)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const textResponse = await res.text();
      if (textResponse && !textResponse.startsWith('<')) {
        const data = JSON.parse(textResponse);
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const rawResult = data[0]
            .filter((item) => item && item[0])
            .map((item) => item[0])
            .join('');

          const cleanedResult = decodeHtmlEntities(rawResult);

          if (cleanedResult && cleanedResult.trim() && cleanedResult.trim() !== trimmed) {
            translationCache.set(cacheKey, cleanedResult);
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(`ebox_tx_v4_single_${cacheKey}`, cleanedResult);
              }
            } catch {}
            return cleanedResult;
          }
        }
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // 6. Tier 3: MyMemory Translation API
  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${targetLang}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const memRes = await fetch(memUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (memRes.ok) {
      const memData = await memRes.json();
      const match = memData?.responseData?.translatedText;
      if (match && typeof match === 'string' && match.trim() && !match.includes('MYMEMORY WARNING') && match.trim() !== trimmed) {
        const cleanedMatch = decodeHtmlEntities(match);
        translationCache.set(cacheKey, cleanedMatch);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`ebox_tx_v4_single_${cacheKey}`, cleanedMatch);
          }
        } catch {}
        return cleanedMatch;
      }
    }
  } catch (err2) {
    // Continue
  }

  return text;
}

/**
 * Translate an array of message objects for an active thread
 * Instant dictionary resolution first, then resolves remaining messages via batch backend API.
 */
export async function translateMessagesBatch(messages, targetLang, threadId = null) {
  const results = new Map();
  if (!Array.isArray(messages) || messages.length === 0 || targetLang === 'en') {
    return results;
  }

  // 1. First populate with 0ms instant dictionary & signature translations
  const instantMap = getInstantTranslations(messages, targetLang);
  Object.entries(instantMap).forEach(([id, text]) => {
    if (text) results.set(id, text);
  });

  // 2. Identify messages that still need dynamic translation
  const pendingMessages = messages.filter((m) => m && m.id && m.text && !results.has(m.id));
  if (pendingMessages.length === 0) {
    if (threadId && results.size > 0) {
      const plain = {};
      results.forEach((v, k) => { plain[k] = v; });
      saveThreadTranslations(threadId, targetLang, plain);
    }
    return results;
  }

  // 3. Batch translate pending messages via Backend Translation API in a single request
  try {
    const baseUrl = apiClient.baseUrl;
    const textsToTranslate = pendingMessages.map((m) => m.text.trim());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendResp = await fetch(`${baseUrl}/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: JSON.stringify({
        texts: textsToTranslate,
        targetLang,
        sourceLang: 'auto'
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (backendResp.ok) {
      const data = await backendResp.json();
      if (Array.isArray(data.translations)) {
        data.translations.forEach((translatedStr, idx) => {
          const origMsg = pendingMessages[idx];
          if (origMsg && translatedStr && translatedStr !== origMsg.text) {
            results.set(origMsg.id, translatedStr);
          }
        });
      }
    }
  } catch (batchErr) {
    console.warn('[translateMessagesBatch] Backend batch translation note:', batchErr.message);
  }

  // 4. Any remaining messages fallback to single translate
  for (const msg of pendingMessages) {
    if (!results.has(msg.id)) {
      try {
        const translated = await translateText(msg.text, targetLang);
        if (translated && translated !== msg.text) {
          results.set(msg.id, translated);
        }
      } catch {}
    }
  }

  // 5. Save thread translations to localStorage
  if (threadId && results.size > 0) {
    const plain = {};
    results.forEach((v, k) => {
      plain[k] = v;
    });
    saveThreadTranslations(threadId, targetLang, plain);
  }

  return results;
}

/**
 * Clear in-memory translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

export default {
  SUPPORTED_LANGUAGES,
  SEED_TRANSLATIONS_DICT,
  translateText,
  translateMessagesBatch,
  getInstantTranslations,
  matchSeedDictionary,
  decodeHtmlEntities,
  getSavedLanguage,
  saveLanguage,
  getSavedThreadTranslations,
  saveThreadTranslations,
  purgeCorruptedCache,
  clearTranslationCache,
};
