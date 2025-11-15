// ===================================================================================
// D A T A B A S E . J S   -   PostgreSQL SÜRÜMÜ
// ===================================================================================

const { Pool } = require('pg');

const categories = [
    { id: 1, title: '1. Temel Kavramlar, Alanlar ve Disiplinler', description: 'Siber güvenliğin temelini oluşturan ana konuları ve uzmanlık alanlarını içermektedir.' },
    { id: 2, title: '2. Güvenlik Mimarileri ve Stratejik Modeller', description: 'Siber güvenlik savunmalarının nasıl tasarlandığına dair üst düzey yaklaşımları ve felsefeleri açıklamaktadır.' },
    { id: 3, title: '3. Teknolojiler, Sistemler ve Araçlar', description: 'Siber güvenlik profesyonellerinin kullandığı spesifik teknoloji kategorileri ve popüler araçlar burada listelenmiştir.' },
    { id: 4, title: '4. Saldırı Türleri, Zafiyetler ve Tehditler', description: 'Siber saldırganların kullandığı yöntemleri, hedefledikleri zafiyetleri ve oluşturdukları tehditleri içermektedir.' },
    { id: 5, title: '5. Kriptografi Kavramları', description: 'Şifreleme bilimiyle ilgili temel ve ileri düzey kavramlar bu başlık altında toplanmıştır.' },
    { id: 6, title: '6. Gelişmekte Olan Alanlar ve İlgili Kavramlar', description: 'Siber güvenliğin geleceğini şekillendiren yeni ve gelişmekte olan teknoloji alanlarıdır.' },
    { id: 7, title: '7. Standartlar, Çerçeveler ve Organizasyonlar', description: 'Siber güvenlik uygulamalarını yönlendiren ve standartlaştıran önemli referans noktalarıdır.' },
    { id: 8, title: '8. Programlama, Betikleme ve Otomasyon', description: 'Güvenlik görevlerini otomatikleştirmek, araçlar geliştirmek ve analiz yapmak için kullanılan diller ve teknolojilerdir.' },
    { id: 9, title: '9. Profesyonel Gelişim ve Beceriler', description: 'Teknik bilginin yanı sıra bir siber güvenlik uzmanının sahip olması gereken yetkinlikler ve kariyer geliştirme aktiviteleridir.' }
];

const concepts = [
    // Kategori 1
    { category_id: 1, title: 'Ağ Güvenliği', english_term_authoritative: 'Network Security', related_keywords: 'firewall, ids, ips, vpn, dmz, network segmentation, port security, nac, proxy', description: 'Bilgisayar ağlarını ve ağ üzerinden erişilebilen kaynakları yetkisiz erişimden koruma uygulamaları.' },
    { category_id: 1, title: 'İşletim Sistemleri Güvenliği', english_term_authoritative: 'Operating Systems Security', related_keywords: 'os hardening, least privilege, selinux, apparmor, windows security, linux security, patch management, access control', description: 'Windows, Linux ve macOS gibi işletim sistemlerindeki güvenlik yapılandırmaları.' },
    { category_id: 1, title: 'Kriptografi Temelleri', english_term_authoritative: 'Cryptography Fundamentals', related_keywords: 'encryption, decryption, cipher, aes, rsa, public key, private key, digital signature, hashing', description: 'Verilerin gizliliğini, bütünlüğünü ve kimlik doğrulamasını sağlamak için kullanılan matematiksel teknikler.' },
    { category_id: 1, title: 'Sızma Testi (Penetration Testing)', english_term_authoritative: 'Penetration Testing', related_keywords: 'pentest, ethical hacking, red team, vulnerability assessment, exploitation, metasploit, burp suite, nmap', description: 'Bir bilgisayar sistemindeki veya ağdaki güvenlik açıklarını bulmak ve sömürmek için yapılan yetkili simüle edilmiş siber saldırı.' },
    { category_id: 1, title: 'Güvenlik Testleri', english_term_authoritative: 'Security Testing', related_keywords: 'security audit, vulnerability assessment, code review, sast, dast, iast, security scanning', description: 'Sistemlerin ve uygulamaların güvenlik durumunu değerlendirmek için yapılan genel testler.' },
    { category_id: 1, title: 'Zafiyet Analizi', english_term_authoritative: 'Vulnerability Analysis', related_keywords: 'cve, cvss, nessus, openvas, risk assessment, vulnerability management, security flaw', description: 'Sistemlerdeki bilinen güvenlik açıklarını (zafiyetleri) belirleme ve değerlendirme süreci.' },
    { category_id: 1, title: 'CTI (Siber Tehdit İstihbaratı)', english_term_authoritative: 'Cyber Threat Intelligence (CTI)', related_keywords: 'threat intelligence, indicators of compromise, ioc, ttp, threat actor, osint, misp', description: 'Potansiyel veya mevcut tehditler hakkında karar almayı destekleyen, toplanmış ve analiz edilmiş bilgi.' },
    { category_id: 1, title: 'Adli Bilişim (Digital Forensics)', english_term_authoritative: 'Digital Forensics', related_keywords: 'dfir, incident response, evidence collection, chain of custody, memory forensics, network forensics, autopsy, volatility', description: 'Siber suçların veya dijital olayların soruşturulması için elektronik verilerin toplanması, incelenmesi ve analizi.' },
    { category_id: 1, title: 'Tehdit Avcılığı (Threat Hunting)', english_term_authoritative: 'Threat Hunting', related_keywords: 'proactive defense, hypothesis-driven, blue team, edr, siem, yara, sigma rules, threat hunting maturity model', description: 'Bir kurumun ağında veya sistemlerinde mevcut olan, ancak mevcut güvenlik araçları tarafından tespit edilmemiş gelişmiş tehditleri proaktif olarak arama süreci.' },
    { category_id: 1, title: 'Olay Yanıtı (Incident Response - DFIR)', english_term_authoritative: 'Incident Response (IR)', related_keywords: 'incident handling, containment, eradication, recovery, playbook, soc, security incident', description: 'Bir güvenlik ihlali veya siber saldırının sonuçlarını yönetme ve müdahale etme yaklaşımı.' },
    { category_id: 1, title: 'Güvenli Yazılım Geliştirme', english_term_authoritative: 'Secure Software Development', related_keywords: 'secure sdlc, threat modeling, secure coding, code review, owasp, application security, appsec', description: 'Yazılım geliştirme yaşam döngüsünün her aşamasına güvenlik uygulamalarını entegre etme pratiği.' },
    { category_id: 1, title: 'Genişleyen Saldırı Yüzeyi', english_term_authoritative: 'Attack Surface', related_keywords: 'attack vector, threat landscape, attack surface management, asm, exposure, digital footprint', description: 'Bir siber saldırganın bir sisteme yetkisiz erişim sağlamak için deneyebileceği tüm potansiyel noktaların toplamı.' },
    // Kategori 2
    { category_id: 2, title: 'Sıfır Güven (Zero Trust) Mimarisi', english_term_authoritative: 'Zero Trust Architecture', related_keywords: 'zero trust, never trust always verify, micro-segmentation, identity and access management, iam, least privilege', description: 'Ağın içindeki veya dışındaki hiçbir kullanıcıya veya cihaza varsayılan olarak güvenilmemesi gerektiğini savunan ve her erişim talebini sıkı bir şekilde doğrulayan bir güvenlik modeli.' },
    { category_id: 2, title: 'Kale-Hendek (Castle-and-Moat) Güvenlik Modeli', english_term_authoritative: 'Castle-and-Moat Security Model', related_keywords: 'perimeter security, traditional security, firewall, defense in depth, legacy security', description: '"İçerisi güvenli, dışarısı tehlikeli" varsayımına dayanan geleneksel güvenlik modeli.' },
    { category_id: 2, title: 'DevSecOps', english_term_authoritative: 'DevSecOps', related_keywords: 'ci/cd pipeline, security as code, shift left security, automation, sast, dast, iac security', description: 'Geliştirme (Development), Güvenlik (Security) ve Operasyonlar (Operations) kelimelerinin birleşimi olup, yazılım geliştirme sürecinin her aşamasına güvenliği entegre etmeyi amaçlayan bir kültür ve pratiktir.' },
    { category_id: 2, title: '"Şimdi Topla, Sonra Kır" (Harvest Now, Decrypt Later)', english_term_authoritative: 'Harvest Now, Decrypt Later', related_keywords: 'quantum computing, post-quantum cryptography, pqc, future threats, data harvesting, encrypted data', description: 'Saldırganların, gelecekte kuantum bilgisayarlar gibi teknolojilerle kırılabileceği umuduyla, mevcut şifreli verileri bugün toplama stratejisi.' },
    // Kategori 3
    { category_id: 3, title: 'Güvenlik Duvarları (Firewalls)', english_term_authoritative: 'Firewalls', related_keywords: 'palo alto, fortinet, cisco asa, check point, next-generation firewall, ngfw, stateful inspection, waf', description: 'Ağ trafiğini önceden belirlenmiş güvenlik kurallarına göre izleyen ve kontrol eden bir ağ güvenliği cihazı.' },
    { category_id: 3, title: 'VPN (Virtual Private Network)', english_term_authoritative: 'Virtual Private Network (VPN)', related_keywords: 'ipsec, ssl vpn, openvpn, remote access, secure tunnel, encryption', description: 'Genel bir ağ üzerinden özel bir ağ bağlantısı oluşturarak güvenli iletişim sağlayan teknoloji.' },
    { category_id: 3, title: 'IDS/IPS (Intrusion Detection/Prevention Systems)', english_term_authoritative: 'Intrusion Detection/Prevention Systems (IDS/IPS)', related_keywords: 'snort, suricata, zeek, network intrusion, signature-based detection, anomaly-based detection, nids, hips', description: 'Ağ veya sistem trafiğini kötü niyetli faaliyetler veya politika ihlalleri açısından izleyen sistemler.' },
    { category_id: 3, title: 'Wireshark', english_term_authoritative: 'Wireshark', related_keywords: 'packet sniffing, network analysis, protocol analyzer, pcap, tcpdump', description: 'Ağ protokolü analiz aracı.' },
    { category_id: 3, title: 'TCP/IP, DNS, VLAN, NAC', english_term_authoritative: 'TCP/IP, DNS, VLAN, NAC', related_keywords: 'networking fundamentals, dns security, dnssec, vlan hopping, network access control, 802.1x', description: 'Temel ağ protokolleri ve güvenlik kavramları.' },
    { category_id: 3, title: 'SIEM (Security Information and Event Management)', english_term_authoritative: 'Security Information and Event Management (SIEM)', related_keywords: 'splunk, elk stack, qradar, arcsight, graylog, log management, event correlation, security analytics, soc', description: 'Güvenlikle ilgili bilgilerin ve olayların gerçek zamanlı analizini sağlayan sistemler.' },
    { category_id: 3, title: 'EDR/XDR (Endpoint Detection and Response)', english_term_authoritative: 'Endpoint Detection and Response (EDR/XDR)', related_keywords: 'endpoint security, malware detection, threat hunting, crowdstrike, sentinelone, carbon black, incident response', description: 'Son kullanıcı cihazlarındaki (bilgisayarlar, sunucular) tehditleri tespit etme ve bunlara müdahale etme teknolojisi.' },
    { category_id: 3, title: 'IAM (Identity & Access Management)', english_term_authoritative: 'Identity & Access Management (IAM)', related_keywords: 'okta, active directory, cyberark, authentication, authorization, single sign-on, sso, privileged access management, pam', description: 'Doğru kişilerin doğru kaynaklara doğru zamanda ve doğru nedenlerle erişimini sağlayan çerçeve.' },
    { category_id: 3, title: 'MFA (Multi-Factor Authentication)', english_term_authoritative: 'Multi-Factor Authentication (MFA)', related_keywords: 'two-factor authentication, 2fa, authenticator app, hardware token, biometrics, phishing prevention', description: 'Çok Faktörlü Kimlik Doğrulama.' },
    { category_id: 3, title: 'Zafiyet Tarayıcıları', english_term_authoritative: 'Vulnerability Scanners', related_keywords: 'nessus, openvas, qualys, nexpose, vulnerability scanning, automated testing', description: 'Ağdaki cihazlarda veya sistemlerde bilinen güvenlik açıklarını tarayan araçlar.' },
    { category_id: 3, title: 'Sızma Testi Araçları', english_term_authoritative: 'Penetration Testing Tools', related_keywords: 'kali linux, metasploit, burp suite, nmap, exploit framework, web application testing', description: 'Kali Linux, Metasploit, Burp Suite, Nmap.' },
    { category_id: 3, title: 'DLP (Data Loss Prevention)', english_term_authoritative: 'Data Loss Prevention (DLP)', related_keywords: 'data exfiltration, sensitive data, data protection, classification, monitoring, endpoint dlp, network dlp', description: 'Hassas verilerin yetkisiz kişilerin eline geçmesini önlemeye yönelik teknolojiler.' },
    { category_id: 3, title: 'Adli Bilişim Araçları', english_term_authoritative: 'Digital Forensics Tools', related_keywords: 'autopsy, volatility, ftk, encase, digital evidence, forensic imaging, file system analysis', description: 'Autopsy, Volatility, FTK, EnCase: Dijital kanıtları analiz etmek için kullanılan yazılımlar.' },
    { category_id: 3, title: 'SAST (Static Application Security Testing)', english_term_authoritative: 'Static Application Security Testing (SAST)', related_keywords: 'white-box testing, source code analysis, secure coding, sonarqube, checkmarx, shift left', description: 'Kaynak kodunu çalıştırmadan analiz eden test yöntemi.' },
    { category_id: 3, title: 'DAST (Dynamic Application Security Testing)', english_term_authoritative: 'Dynamic Application Security Testing (DAST)', related_keywords: 'black-box testing, web application scanning, runtime analysis, owasp zap, burp suite', description: 'Çalışan uygulamayı analiz eden test yöntemi.' },
    { category_id: 3, title: 'Güvenli Kod Analizi Araçları', english_term_authoritative: 'Secure Code Analysis Tools', related_keywords: 'sonarqube, checkmarx, bandit, sast, code quality, security vulnerabilities', description: 'SonarQube, Checkmarx, Bandit.' },
    // Kategori 4
    { category_id: 4, title: 'SQL Injection (SQLi)', english_term_authoritative: 'SQL Injection (SQLi)', related_keywords: 'database security, owasp top 10, input validation, parameterized queries, web security', description: 'Bir uygulamanın veritabanına zararlı SQL kodları enjekte etme saldırısı.' },
    { category_id: 4, title: 'XSS (Cross-Site Scripting)', english_term_authoritative: 'Cross-Site Scripting (XSS)', related_keywords: 'web application security, owasp top 10, stored xss, reflected xss, dom-based xss, content security policy, csp', description: 'Zararlı betiklerin güvenilir web sitelerine enjekte edildiği bir saldırı türü.' },
    { category_id: 4, title: 'CSRF (Cross-Site Request Forgery)', english_term_authoritative: 'Cross-Site Request Forgery (CSRF)', related_keywords: 'web security, owasp, session riding, anti-csrf tokens, same-site cookies', description: 'Bir kullanıcının oturumunu kullanarak onun adına istenmeyen eylemler gerçekleştirmeye zorlayan bir saldırı.' },
    { category_id: 4, title: 'Yapay Zeka Destekli Oltalama (AI-Powered Phishing)', english_term_authoritative: 'AI-Powered Phishing', related_keywords: 'phishing, social engineering, spear phishing, generative ai, large language models, llm, business email compromise, bec', description: 'İkna ediciliği artırılmış ve hedefe özel oltalama saldırıları.' },
    { category_id: 4, title: 'Kendini Adapte Edebilen Kötü Amaçlı Yazılımlar (Adaptive Malware)', english_term_authoritative: 'Adaptive Malware', related_keywords: 'polymorphic malware, metamorphic malware, evasion techniques, sandbox detection, advanced persistent threat, apt', description: 'Tespit edilmekten kaçınmak için davranışlarını veya kodunu değiştirebilen zararlı yazılımlar.' },
    { category_id: 4, title: 'Deepfake', english_term_authoritative: 'Deepfake', related_keywords: 'disinformation, social engineering, vishing, identity fraud, generative adversarial networks, gan', description: 'Sosyal mühendislik saldırılarında kullanılan, yapay zeka ile üretilmiş sahte video veya ses kayıtları.' },
    { category_id: 4, title: 'İçeriden Tehditler (Insider Threats)', english_term_authoritative: 'Insider Threats', related_keywords: 'insider risk, malicious insider, unintentional insider, user behavior analytics, ueba, data exfiltration', description: 'Kurum içinden kaynaklanan kasıtlı veya kasıtsız güvenlik tehditleri.' },
    { category_id: 4, title: 'Sosyal Mühendislik', english_term_authoritative: 'Social Engineering', related_keywords: 'phishing, vishing, smishing, pretexting, baiting, human factor, security awareness', description: 'İnsanları kandırarak gizli bilgileri elde etme sanatı.' },
    { category_id: 4, title: 'OT (Operasyonel Teknolojiler) Saldırıları', english_term_authoritative: 'Operational Technology (OT) Attacks', related_keywords: 'industrial control systems, ics, scada security, critical infrastructure, plc, purdue model', description: 'Endüstriyel kontrol sistemleri gibi fiziksel süreçleri yöneten teknolojilere yönelik saldırılar.' },
    // Kategori 5
    { category_id: 5, title: 'Şifreleme Algoritmaları', english_term_authoritative: 'Encryption Algorithms', related_keywords: 'aes, rsa, sha, ecc, symmetric, asymmetric, block cipher, stream cipher', description: 'AES (simetrik), RSA (asimetrik), SHA (hash), ECC (asimetrik).' },
    { category_id: 5, title: 'Simetrik ve Asimetrik Şifreleme', english_term_authoritative: 'Symmetric and Asymmetric Encryption', related_keywords: 'private key, public key, shared secret, pki, key exchange, diffie-hellman', description: 'Şifreleme ve deşifreleme için aynı anahtarın (simetrik) veya farklı anahtarların (asimetrik) kullanıldığı yöntemler.' },
    { category_id: 5, title: 'Hash Fonksiyonları', english_term_authoritative: 'Hash Functions', related_keywords: 'md5, sha-1, sha-256, bcrypt, scrypt, password hashing, integrity check, collision resistance', description: 'Değişken boyutlu veriyi sabit boyutlu bir çıktıya dönüştüren tek yönlü fonksiyonlar.' },
    { category_id: 5, title: 'Kuantum Kırılması (Quantum Break)', english_term_authoritative: 'Quantum Break', related_keywords: 'quantum computing, shors algorithm, rsa, ecc, cryptography, future risk', description: 'Kuantum bilgisayarların mevcut asimetrik şifreleme algoritmalarını etkisiz hale getireceği varsayımsal an.' },
    { category_id: 5, title: 'Kuantum Sonrası Kriptografi (PQC)', english_term_authoritative: 'Post-Quantum Cryptography (PQC)', related_keywords: 'quantum-resistant, nist pqc, crystals-kyber, crystals-dilithium, lattice-based cryptography', description: 'Kuantum bilgisayarların saldırılarına karşı dirençli olduğu düşünülen kriptografik algoritmalar.' },
    // Kategori 6
    { category_id: 6, title: 'Anomali Tespiti', english_term_authoritative: 'Anomaly Detection', related_keywords: 'behavioral analysis, machine learning, user behavior analytics, ueba, network traffic analysis, baseline', description: 'Normal davranış kalıplarından sapmaları tespit etme.' },
    { category_id: 6, title: 'Otomatize Edilmiş Olay Müdahalesi (SOAR)', english_term_authoritative: 'Security Orchestration, Automation, and Response (SOAR)', related_keywords: 'security automation, orchestration, playbook, incident response, soc efficiency, api integration', description: 'Güvenlik operasyonlarını otomatikleştiren ve düzenleyen teknolojiler.' },
    { category_id: 6, title: 'Adversarial ML', english_term_authoritative: 'Adversarial Machine Learning', related_keywords: 'ai security, model evasion, data poisoning, adversarial examples, machine learning security', description: 'Makine öğrenmesi modellerini yanıltmayı veya manipüle etmeyi amaçlayan teknikler.' },
    { category_id: 6, title: 'Prompt Injection', english_term_authoritative: 'Prompt Injection', related_keywords: 'large language model, llm security, generative ai, ai hacking, owasp top 10 for llm', description: 'Dil modellerini istenmeyen çıktılar üretmeye zorlamak için tasarlanmış girdiler.' },
    { category_id: 6, title: 'Endüstriyel Kontrol Sistemleri (SCADA)', english_term_authoritative: 'Industrial Control Systems (ICS/SCADA)', related_keywords: 'ot security, critical infrastructure, plc, hmi, purdue model, isa/iec 62443', description: 'Endüstriyel süreçleri izleyen ve kontrol eden sistemler.' },
    { category_id: 6, title: 'Gömülü Sistemler (Embedded Systems) Güvenliği', english_term_authoritative: 'Embedded Systems Security', related_keywords: 'iot security, firmware security, hardware security, real-time operating system, rtos', description: 'Belirli bir işlevi yerine getirmek üzere tasarlanmış özel bilgisayar sistemlerinin güvenliği.' },
    { category_id: 6, title: 'Donanım "Hacking"', english_term_authoritative: 'Hardware Hacking', related_keywords: 'side-channel attack, fault injection, jtag, uart, reverse engineering, firmware extraction', description: 'Fiziksel cihazlara müdahale ederek güvenliklerini aşma.' },
    { category_id: 6, title: 'Endüstriyel Protokoller', english_term_authoritative: 'Industrial Protocols', related_keywords: 'modbus, profinet, dnp3, s7comm, ot protocols, industrial networking', description: 'Modbus, Profinet.' },
    // Kategori 7
    { category_id: 7, title: 'OWASP Top 10', english_term_authoritative: 'OWASP Top 10', related_keywords: 'web application security, appsec, common vulnerabilities, sqli, xss, injection, broken access control', description: 'Web uygulamalarındaki en kritik 10 güvenlik riskinin bir listesi.' },
    { category_id: 7, title: 'CVE (Common Vulnerabilities and Exposures)', english_term_authoritative: 'Common Vulnerabilities and Exposures (CVE)', related_keywords: 'vulnerability database, cve id, nvd, mitre, vulnerability management, security advisory', description: 'Halka açık olarak bilinen siber güvenlik zafiyetlerinin bir listesi.' },
    { category_id: 7, title: 'CVSS (Common Vulnerability Scoring System)', english_term_authoritative: 'Common Vulnerability Scoring System (CVSS)', related_keywords: 'vulnerability scoring, risk assessment, cvss score, base score, temporal score, environmental score', description: 'Zafiyetlerin ciddiyetini derecelendirmek için kullanılan bir endüstri standardı.' },
    { category_id: 7, title: 'MITRE ATT&CK', english_term_authoritative: 'MITRE ATT&CK Framework', related_keywords: 'adversary tactics, techniques, and procedures, ttp, threat modeling, threat hunting, adversary emulation', description: 'Siber saldırganların kullandığı taktik ve tekniklerin küresel olarak erişilebilir bir bilgi tabanı.' },
    { category_id: 7, title: 'NIST (Ulusal Standartlar ve Teknoloji Enstitüsü)', english_term_authoritative: 'National Institute of Standards and Technology (NIST)', related_keywords: 'nist cybersecurity framework, nist csf, special publication, sp 800-53, standards, compliance', description: 'ABD\'de siber güvenlik standartlarını ve en iyi uygulamaları geliştiren bir kurum.' },
    { category_id: 7, title: 'CISA (Cybersecurity and Infrastructure Security Agency)', english_term_authoritative: 'Cybersecurity and Infrastructure Security Agency (CISA)', related_keywords: 'us government, critical infrastructure, security advisories, alerts, incident coordination', description: 'ABD\'nin siber güvenlik ve altopı güvenliğinden sorumlu kurumu.' },
    { category_id: 7, title: 'YARA / Sigma Rules', english_term_authoritative: 'YARA / Sigma Rules', related_keywords: 'threat detection, rule-based detection, malware analysis, incident response, siem, threat hunting', description: 'Tehdit avcılığı ve olay müdahalesinde zararlı yazılımları veya şüpheli aktiviteleri tanımlamak için kullanılan kural tabanlı yaklaşımlar.' },
    // Kategori 8
    { category_id: 8, title: 'Programlama Dilleri', english_term_authoritative: 'Programming Languages', related_keywords: 'python, c, go, rust, secure coding, memory safety', description: 'Python, C, Go.' },
    { category_id: 8, title: 'Betikleme Dilleri (Scripting)', english_term_authoritative: 'Scripting Languages', related_keywords: 'bash, powershell, javascript, shell scripting, automation, scripting for security', description: 'Bash, PowerShell, JavaScript, Shell Scripting.' },
    { category_id: 8, title: 'Veritabanı Dili', english_term_authoritative: 'Database Language', related_keywords: 'sql, nosql, sql injection, database security', description: 'SQL.' },
    { category_id: 8, title: 'Otomasyon Araçları', english_term_authoritative: 'Automation Tools', related_keywords: 'ansible, terraform, puppet, chef, infrastructure as code, iac, security automation', description: 'Ansible, Terraform.' },
    { category_id: 8, title: 'Python Kütüphaneleri (AI/ML Odaklı)', english_term_authoritative: 'Python Libraries (AI/ML Focused)', related_keywords: 'scikit-learn, tensorflow, keras, pandas, numpy, security data science, machine learning', description: 'Scikit-learn, TensorFlow, Keras, Pandas.' },
    // Kategori 9
    { category_id: 9, title: 'CTF (Capture The Flag) Yarışmaları', english_term_authoritative: 'Capture The Flag (CTF) Competitions', related_keywords: 'hack the box, tryhackme, jeopardy style, attack-defense, practical skills, cybersecurity training', description: 'Pratik siber güvenlik becerilerini geliştirmek için tasarlanmış yarışmalar.' },
    { category_id: 9, title: 'Açık Kaynak Projelere Katkı', english_term_authoritative: 'Contributing to Open Source Projects', related_keywords: 'github, open source security, community, collaboration, portfolio building', description: 'GitHub gibi platformlarda güvenlik projelerine katkıda bulunmak.' },
    { category_id: 9, title: 'Kendi Lab Ortamını Oluşturmak', english_term_authoritative: 'Building Your Own Lab Environment', related_keywords: 'homelab, virtualbox, vmware, docker, kubernetes, hands-on practice, safe environment', description: 'Sanallaştırma yazılımları (VirtualBox, VMware) ile pratik yapmak.' },
    { category_id: 9, title: 'Blog Yazmak', english_term_authoritative: 'Blogging', related_keywords: 'technical writing, knowledge sharing, personal branding, thought leadership, community contribution', description: 'Öğrenilen bilgileri paylaşarak hem topluluğa katkı sağlamak hem de kişisel markayı güçlendirmek.' },
    { category_id: 9, title: 'Analitik Düşünme ve Problem Çözme', english_term_authoritative: 'Analytical Thinking and Problem Solving', related_keywords: 'critical thinking, root cause analysis, troubleshooting, logical reasoning, soft skills', description: 'Güvenlik olaylarını analiz etme ve çözüm üretme yeteneği.' },
    { category_id: 9, title: 'İletişim Yeteneği ve Rapor Yazma', english_term_authoritative: 'Communication Skills and Report Writing', related_keywords: 'technical reporting, executive summary, stakeholder communication, presentation skills, soft skills', description: 'Teknik bulguları hem teknik hem de teknik olmayan paydaşlara anlaşılır bir şekilde sunabilme.' },
    { category_id: 9, title: 'Ekip Çalışması', english_term_authoritative: 'Teamwork', related_keywords: 'collaboration, red team, blue team, purple team, communication, shared goals, soft skills', description: 'Red Team (saldırı) ve Blue Team (savunma) gibi takımlarda etkin bir şekilde çalışabilme.' },
    { category_id: 9, title: 'Müzakere', english_term_authoritative: 'Negotiation', related_keywords: 'risk communication, business impact, stakeholder management, influencing, decision making, soft skills', description: 'Güvenlik bulgularının iş üzerindeki etkisini (finansal kayıp, itibar zedelenmesi) yöneticilere aktarabilme.' }
];

const advancedConcepts = [
    // --- BÖLÜM: Yönetişim, Risk ve Uyum (GRC) & Strateji ---
    { category_id: 7, title: 'NIST Cybersecurity Framework (CSF)', english_term_authoritative: 'NIST Cybersecurity Framework (CSF)', related_keywords: 'identify, protect, detect, respond, recover, risk management, cybersecurity framework, compliance', description: 'Risk yönetimi için en yaygın çerçevelerden biri.' },
    { category_id: 7, title: 'ISO/IEC 27001 & 27002', english_term_authoritative: 'ISO/IEC 27001 & 27002', related_keywords: 'isms, information security management system, certification, audit, controls, annex a, statement of applicability', description: 'Bilgi Güvenliği Yönetim Sistemleri (BGYS) için uluslararası standartlar.' },
    { category_id: 7, title: 'CIS Controls', english_term_authoritative: 'CIS Controls', related_keywords: 'cis benchmarks, sans, prioritized controls, hardening, implementation groups, ig1, ig2, ig3', description: 'Siber savunma için önceliklendirilmiş ve pratik bir kontrol seti.' },
    { category_id: 7, title: 'COBIT', english_term_authoritative: 'COBIT', related_keywords: 'it governance, it management, framework, isaca, business goals, control objectives', description: 'BT yönetişimi ve yönetimi için bir çerçeve.' },
    { category_id: 7, title: 'KVKK (Kişisel Verilerin Korunması Kanunu)', english_term_authoritative: 'Personal Data Protection Law (KVKK)', related_keywords: 'veri sorumlusu, verbis, kişisel veri, data protection, privacy, compliance, türkiye', description: 'Türkiye\'deki kişisel verilerin korunmasına yönelik yasal çerçeve.' },
    { category_id: 7, title: 'GDPR (General Data Protection Regulation)', english_term_authoritative: 'General Data Protection Regulation (GDPR)', related_keywords: 'european union, eu, data privacy, right to be forgotten, dpo, data protection officer, compliance', description: 'Avrupa Birliği\'nin veri koruma ve gizlilik yönetmeliği.' },
    { category_id: 7, title: 'PCI DSS', english_term_authoritative: 'Payment Card Industry Data Security Standard (PCI DSS)', related_keywords: 'payment card, credit card security, compliance, qsa, secure payments, cardholder data', description: 'Kartlı ödeme sistemleri verilerinin güvenliği standardı.' },
    { category_id: 7, title: 'HIPAA', english_term_authoritative: 'Health Insurance Portability and Accountability Act (HIPAA)', related_keywords: 'healthcare, patient data, protected health information, phi, compliance, us law', description: 'Sağlık verilerinin korunmasına yönelik ABD standardı.' },
    { category_id: 7, title: 'Risk Değerlendirme ve Analizi', english_term_authoritative: 'Risk Assessment and Analysis', related_keywords: 'risk matrix, threat, vulnerability, impact, likelihood, quantitative analysis, qualitative analysis', description: 'Varlıkları, tehditleri ve zafiyetleri belirleyerek riski ölçme süreci.' },
    { category_id: 7, title: 'Üçüncü Parti Risk Yönetimi', english_term_authoritative: 'Third-Party Risk Management (TPRM)', related_keywords: 'vendor risk, supply chain security, questionnaires, due diligence, third party risk', description: 'Tedarikçilerden ve iş ortaklarından kaynaklanan siber risklerin yönetilmesi.' },
    { category_id: 7, title: 'Güvenlik Denetimleri (Security Audits)', english_term_authoritative: 'Security Audits', related_keywords: 'compliance audit, internal audit, external audit, evidence, gap analysis, security controls', description: 'Güvenlik kontrollerinin etkinliğini ve uyumluluğunu doğrulamak için yapılan resmi incelemeler.' },

    // --- BÖLÜM: Gelişmiş Bulut Güvenliği ---
    { category_id: 6, title: 'CSPM (Cloud Security Posture Management)', english_term_authoritative: 'Cloud Security Posture Management (CSPM)', related_keywords: 'cloud misconfiguration, compliance monitoring, cloud security, posture management, automation, aws, azure, gcp', description: 'Bulut ortamlarındaki yanlış yapılandırmaları ve uyumluluk risklerini tespit eden araçlar.' },
    { category_id: 6, title: 'CWPP (Cloud Workload Protection Platforms)', english_term_authoritative: 'Cloud Workload Protection Platforms (CWPP)', related_keywords: 'cloud workload, container security, serverless security, kubernetes security, runtime security', description: 'Sanal makineler, konteynerler ve sunucusuz uygulamalar gibi bulut iş yüklerini koruyan çözümler.' },
    { category_id: 6, title: 'CASB (Cloud Access Security Broker)', english_term_authoritative: 'Cloud Access Security Broker (CASB)', related_keywords: 'cloud access, saas security, shadow it, data protection, api-based, proxy-based', description: 'Kullanıcılar ve bulut hizmetleri arasında yer alarak güvenlik politikalarını uygulayan kontrol noktaları.' },
    { category_id: 6, title: 'Konteyner ve Kubernetes Güvenliği', english_term_authoritative: 'Container and Kubernetes Security', related_keywords: 'docker security, k8s security, image scanning, runtime security, pod security policy, network policy', description: 'Docker ve Kubernetes gibi teknolojilerin imaj, ağ ve çalışma zamanı güvenliği.' },
    { category_id: 6, title: 'IaC (Infrastructure as Code) Güvenliği', english_term_authoritative: 'Infrastructure as Code (IaC) Security', related_keywords: 'terraform security, cloudformation, misconfiguration, shift left, static analysis, checkov, tfsec', description: 'Terraform, CloudFormation gibi araçlarla oluşturulan altyapı kodlarında güvenlik açıklarını tarama.' },
    { category_id: 6, title: 'CIEM (Cloud Infrastructure Entitlement Management)', english_term_authoritative: 'Cloud Infrastructure Entitlement Management (CIEM)', related_keywords: 'cloud permissions, least privilege, iam, excessive permissions, entitlement management, cloud iam', description: 'Bulut ortamlarındaki karmaşık izinleri yöneterek aşırı yetkilendirmeyi önleyen teknolojiler.' },

    // --- BÖLÜM: Uygulama ve Yazılım Güvenliği (AppSec) Derinlemesine ---
    { category_id: 3, title: 'API Güvenliği (OWASP API Security Top 10)', english_term_authoritative: 'API Security (OWASP API Security Top 10)', related_keywords: 'rest api, graphql, authentication, authorization, rate limiting, broken object level authorization, bola', description: 'RESTful ve GraphQL gibi API\'lerin kimlik doğrulama, yetkilendirme ve saldırılara karşı korunması.' },
    { category_id: 3, title: 'SBOM (Software Bill of Materials)', english_term_authoritative: 'Software Bill of Materials (SBOM)', related_keywords: 'software supply chain, dependencies, vulnerability management, open source security, cyclonedx, spdx', description: 'Bir yazılımın içerdiği tüm açık kaynak ve üçüncü parti bileşenlerin listesi.' },
    { category_id: 3, title: 'IAST (Interactive Application Security Testing)', english_term_authoritative: 'Interactive Application Security Testing (IAST)', related_keywords: 'interactive testing, grey-box testing, runtime analysis, agent-based, dast, sast', description: 'Uygulama çalışırken içeriden analiz yaparak DAST ve SAST testlerini birleştiren yaklaşım.' },
    { category_id: 3, title: 'RASP (Runtime Application Self-Protection)', english_term_authoritative: 'Runtime Application Self-Protection (RASP)', related_keywords: 'runtime protection, self-protection, application security, attack detection, blocking, jvm', description: 'Saldırıları çalışma zamanında tespit edip engelleyen, uygulamaya entegre teknoloji.' },
    { category_id: 3, title: 'Mobil Uygulama Güvenliği (OWASP MASVS)', english_term_authoritative: 'Mobile Application Security (OWASP MASVS)', related_keywords: 'owasp masvs, ios security, android security, reverse engineering, mobile pentesting, static analysis, dynamic analysis', description: 'iOS ve Android platformlarına özgü zafiyetlerin analizi ve güvenli kodlama pratikleri.' },
    
    // --- BÖLÜM: İleri Düzey Güvenlik Operasyonları (Advanced SecOps) ---
    { category_id: 1, title: 'Tehdit Modelleme (Threat Modeling)', english_term_authoritative: 'Threat Modeling', related_keywords: 'stride, dread, attack trees, proactive security, secure design, shift left', description: 'Bir sistemin potansiyel güvenlik tehditlerini proaktif olarak belirleme süreci. (Metodolojiler: STRIDE, DREAD)' },
    { category_id: 1, title: 'Mor Takım (Purple Teaming)', english_term_authoritative: 'Purple Teaming', related_keywords: 'red team, blue team, collaboration, continuous improvement, ttp, adversary emulation, control validation', description: 'Kırmızı ve Mavi takımların iş birliği içinde çalışarak savunma yeteneklerini test ettiği tatbikat.' },
    { category_id: 1, title: 'Aldatma Teknolojisi (Deception Technology)', english_term_authoritative: 'Deception Technology', related_keywords: 'honeypot, honeytoken, decoy, adversary engagement, threat intelligence gathering', description: 'Saldırganları kandırmak ve izlemek için tasarlanmış sahte sistemler ve yemler (Honeypots).' },
    { category_id: 1, title: 'DRPS (Digital Risk Protection Services)', english_term_authoritative: 'Digital Risk Protection Services (DRPS)', related_keywords: 'digital footprint, brand protection, dark web monitoring, takedown services, external attack surface', description: 'Bir kurumun markasını ve verilerini açık/derin/karanlık web üzerindeki tehditlere karşı koruyan hizmetler.' },
    { category_id: 1, title: 'Güvenlik Oyun Kitapları (Security Playbooks)', english_term_authoritative: 'Security Playbooks', related_keywords: 'incident response plan, soar, automation, standard operating procedure, sop, runbook', description: 'Belirli bir siber olaya müdahale etmek için önceden tanımlanmış, adım adım prosedürler bütünü.' },

    // --- BÖLÜM: Özel Uzmanlık Alanları ve Araçları ---
    { category_id: 3, title: 'Zararlı Yazılım Analizi Araçları', english_term_authoritative: 'Malware Analysis Tools', related_keywords: 'ida pro, ghidra, cuckoo sandbox, any.run, static analysis, dynamic analysis, reverse engineering', description: 'Statik (IDA Pro, Ghidra) ve Dinamik (Cuckoo Sandbox, ANY.RUN) analiz araçları.' },
    { category_id: 3, title: 'Hata Ayıklayıcılar (Debuggers)', english_term_authoritative: 'Debuggers', related_keywords: 'x64dbg, ollydbg, windbg, gdb, reverse engineering, runtime analysis, exploit development', description: 'x64dbg, OllyDbg, WinDbg gibi araçlarla yazılımların çalışma zamanı analizleri.' },
    { category_id: 3, title: 'Kırmızı Takım (Red Team) Çerçeveleri', english_term_authoritative: 'Red Team Frameworks', related_keywords: 'cobalt strike, covenant, sliver, command and control, c2, adversary simulation, post-exploitation', description: 'Komuta ve Kontrol (C2) için kullanılan araçlar.' },
    { category_id: 3, title: 'Active Directory Sömürü Araçları', english_term_authoritative: 'Active Directory Exploitation Tools', related_keywords: 'bloodhound, mimikatz, impacket, kerberoasting, golden ticket, ad security, domain controller', description: 'BloodHound, Mimikatz, Impacket gibi AD ortamlarına yönelik sızma testi araçları.' },
    { category_id: 3, title: 'Bellek Analizi (Memory Forensics)', english_term_authoritative: 'Memory Forensics', related_keywords: 'volatility framework, memory dump, ram analysis, digital forensics, malware analysis, process analysis', description: 'Volatility Framework kullanarak bellek dökümlerinden adli kanıtları çıkarma.' },
    
    // --- BÖLÜM: İş Sürekliliği ve Kriz Yönetimi ---
    { category_id: 7, title: 'BCP (Business Continuity Planning)', english_term_authoritative: 'Business Continuity Planning (BCP)', related_keywords: 'business continuity, disaster recovery, crisis management, business impact analysis, bia', description: 'Kriz anında kritik iş fonksiyonlarının devamlılığını sağlayan süreçler bütünü.' },
    { category_id: 7, title: 'DR (Disaster Recovery)', english_term_authoritative: 'Disaster Recovery (DR)', related_keywords: 'disaster recovery plan, drp, rto, rpo, failover, backup and recovery, data center recovery', description: 'Bir felaket sonrası BT altyapısını ve operasyonlarını yeniden çalışır hale getirme planı.' },
    { category_id: 7, title: 'RTO/RPO Metrikleri', english_term_authoritative: 'RTO/RPO Metrics', related_keywords: 'recovery time objective, recovery point objective, business continuity, disaster recovery, service level agreement, sla', description: 'Kurtarma Süresi (RTO) ve Kurtarma Noktası (RPO) Hedeflerini belirleyen metrikler.' },
    { category_id: 7, title: 'Masa Başı Tatbikatları (Tabletop Exercises)', english_term_authoritative: 'Tabletop Exercises', related_keywords: 'incident response testing, crisis simulation, decision making, ir plan validation, security awareness', description: 'Bir kriz senaryosunu simüle ederek müdahale ekiplerinin karar verme süreçlerini test etme.' },

    // --- BÖLÜM: OT ve ICS Güvenliği ---
    { category_id: 6, title: 'SCADA, PLC, DCS Sistemleri', english_term_authoritative: 'SCADA, PLC, DCS Systems', related_keywords: 'industrial control systems, ics, supervisory control and data acquisition, programmable logic controller, distributed control system', description: 'Endüstriyel kontrol sistemlerini (ICS) oluşturan temel bileşenler.' },
    { category_id: 6, title: 'Purdue Modeli & Air Gap', english_term_authoritative: 'Purdue Model & Air Gap', related_keywords: 'ot network architecture, network segmentation, industrial network, physical isolation, defense in depth', description: 'Endüstriyel ağları segmentlere ayırmak ve izole etmek için kullanılan mimari ve pratikler.' },
    { category_id: 6, title: 'OT\'ye Özgü Protokoller', english_term_authoritative: 'OT-Specific Protocols', related_keywords: 'modbus, dnp3, profinet, s7, opc ua, industrial protocols', description: 'Modbus, DNP3, Profinet gibi endüstriyel ortamlara özgü iletişim protokolleri.' },
    { category_id: 6, title: 'ISA/IEC 62443 Standardı', english_term_authoritative: 'ISA/IEC 62443 Standard', related_keywords: 'ics security standard, ot security, industrial cybersecurity, zones and conduits, compliance', description: 'Endüstriyel otomasyon ve kontrol sistemleri güvenliği için uluslararası standartlar serisi.' },
    { category_id: 6, title: 'Pasif Ağ İzleme (OT)', english_term_authoritative: 'Passive Network Monitoring (OT)', related_keywords: 'nozomi, dragos, claroty, ot visibility, threat detection, asset inventory, non-intrusive', description: 'OT ağlarını kesintiye uğratmadan izleyen özel güvenlik araçları.' },
    
    // --- BÖLÜM: İleri Düzey Kriptografi ---
    { category_id: 5, title: 'PKI (Public Key Infrastructure)', english_term_authoritative: 'Public Key Infrastructure (PKI)', related_keywords: 'digital certificates, certificate authority, ca, registration authority, ra, ssl/tls, key management', description: 'Dijital sertifikaların oluşturulması, yönetilmesi ve doğrulanması için gereken altyapı.' },
    { category_id: 5, title: 'Anahtar Yönetim Sistemleri (KMS)', english_term_authoritative: 'Key Management Systems (KMS)', related_keywords: 'cryptographic keys, key lifecycle management, hsm, key generation, key rotation', description: 'Kriptografik anahtarların yaşam döngüsünü yöneten sistemler.' },
    { category_id: 5, title: 'HSM (Hardware Security Module)', english_term_authoritative: 'Hardware Security Module (HSM)', related_keywords: 'cryptographic hardware, secure key storage, physical security, fips 140-2, key protection', description: 'Kriptografik anahtarları korumak için kullanılan fiziksel güvenlik cihazları.' },
    { category_id: 5, title: 'Homomorfik Şifreleme', english_term_authoritative: 'Homomorphic Encryption', related_keywords: 'privacy preserving computation, encrypted data processing, fully homomorphic encryption, fhe', description: 'Verileri deşifre etmeden üzerinde hesaplama yapmaya olanak tanıyan şifreleme türü.' },
    { category_id: 5, title: 'Sıfır Bilgi İspatları (ZKP)', english_term_authoritative: 'Zero-Knowledge Proofs (ZKP)', related_keywords: 'cryptographic proof, privacy, verification, blockchain, zk-snarks, zk-starks', description: 'Bir bilginin doğruluğunu, bilginin kendisini açıklamadan kanıtlama yöntemi.' },
    
    // --- BÖLÜM: Siber Tehdit İstihbaratı (CTI) Yaşam Döngüsü ---
    { category_id: 1, title: 'İstihbarat Yaşam Döngüsü', english_term_authoritative: 'Intelligence Cycle', related_keywords: 'planning, collection, processing, analysis, dissemination, feedback, cti lifecycle', description: 'Planlama, Toplama, İşleme, Analiz, Yayma ve Geri Bildirim adımlarından oluşan süreç.' },
    { category_id: 1, title: 'Stratejik, Operasyonel ve Taktiksel İstihbarat', english_term_authoritative: 'Strategic, Operational, and Tactical Intelligence', related_keywords: 'threat intelligence types, strategic, operational, tactical, c-level, soc analyst, iocs', description: 'Farklı seviyelerdeki karar alıcılara yönelik istihbarat türleri.' },
    { category_id: 1, title: 'Cyber Kill Chain® Modeli', english_term_authoritative: 'Cyber Kill Chain® Model', related_keywords: 'lockheed martin, attack lifecycle, reconnaissance, weaponization, delivery, exploitation, installation, c2', description: 'Bir siber saldırının aşamalarını modelleyen bir çerçeve.' },
    { category_id: 1, title: 'Diamond Model of Intrusion Analysis', english_term_authoritative: 'Diamond Model of Intrusion Analysis', related_keywords: 'adversary, infrastructure, victim, capability, intrusion analysis, threat intelligence', description: 'Saldırı olaylarını dört temel unsur (saldırgan, altyapı, kurban, yetenek) üzerinden analiz eden model.' },
    { category_id: 1, title: 'MISP (Malware Information Sharing Platform)', english_term_authoritative: 'Malware Information Sharing Platform (MISP)', related_keywords: 'threat sharing, open source, threat intelligence platform, tip, indicators of compromise, ioc sharing', description: 'Tehdit istihbaratını paylaşmak için kullanılan popüler bir açık kaynak platform.' },
    
    // --- BÖLÜM: Donanım ve Fiziksel Güvenlik ---
    { category_id: 6, title: 'Yan Kanal Saldırıları (Side-Channel Attacks)', english_term_authoritative: 'Side-Channel Attacks', related_keywords: 'power analysis, timing attack, electromagnetic analysis, hardware security, physical attack', description: 'Bir cihazın güç tüketimi gibi fiziksel özelliklerini analiz ederek gizli bilgileri elde etme.' },
    { category_id: 6, title: 'Firmware Güvenliği (UEFI/BIOS)', english_term_authoritative: 'Firmware Security (UEFI/BIOS)', related_keywords: 'uefi secure boot, bios password, firmware update, binwalk, reverse engineering, hardware security', description: 'Bilgisayarların en temel açılış yazılımının güvenliği ve analizi. (Araç: Binwalk)' },
    { category_id: 6, title: 'Veri Merkezi Fiziksel Güvenliği', english_term_authoritative: 'Data Center Physical Security', related_keywords: 'access control, surveillance, mantraps, biometric access, scif, physical security', description: 'Sunucuların bulunduğu alanlara fiziksel erişimin kontrolü ve SCIF gibi güvenli alanlar.' },
    
    // --- BÖLÜM: İnsan Faktörü ve Güvenlik Kültürü ---
    { category_id: 9, title: 'Güvenlik Kültürü', english_term_authoritative: 'Security Culture', related_keywords: 'security awareness, human firewall, shared responsibility, top-down approach, security champions', description: 'Tüm çalışanların güvenliği doğal bir sorumluluk olarak benimsediği ortak değerler bütünü.' },
    { category_id: 9, title: 'Vishing & Smishing', english_term_authoritative: 'Vishing & Smishing', related_keywords: 'voice phishing, sms phishing, social engineering, phishing, pretexting', description: 'Telefon (Voice Phishing) ve SMS (SMS Phishing) yoluyla yapılan oltalama saldırıları.' },
    { category_id: 9, title: 'Güvenlik Farkındalığında Oyunlaştırma (Gamification)', english_term_authoritative: 'Gamification in Security Awareness', related_keywords: 'security training, engagement, leaderboards, points, badges, interactive learning', description: 'Güvenlik eğitimlerini daha ilgi çekici hale getirmek için oyun mekaniklerini kullanma.' },
    
    // --- BÖLÜM: Siber Hukuk, Etik ve Uluslararası İlişkiler ---
    { category_id: 9, title: 'Atribüsyon (Attribution)', english_term_authoritative: 'Attribution', related_keywords: 'threat actor attribution, attribution analysis, indicators of compromise, ioc, nation-state actors', description: 'Bir siber saldırının arkasında kimin olduğunu belirleme ve kanıtlama süreci.' },
    { category_id: 9, title: 'Sorumlu Açıklama (Responsible Disclosure)', english_term_authoritative: 'Responsible Disclosure', related_keywords: 'vulnerability disclosure, bug bounty, coordinated disclosure, security ethics, zero-day', description: 'Bir zafiyeti kamuoyuna duyurmadan önce üreticiye bildirerek düzeltme süresi tanıma etiği.' },
    { category_id: 9, title: 'Siber Savaş (Cyber Warfare) ve Tallinn Manueli', english_term_authoritative: 'Cyber Warfare and the Tallinn Manual', related_keywords: 'nation-state attacks, cyber conflict, international law, rules of engagement, critical infrastructure attacks', description: 'Devletlerarası siber saldırılar ve bu alandaki uluslararası hukuk rehberleri.' }
];

const extraAdvancedConcepts = [
    // --- Kategori: Siber Güvenlik ve İş Stratejisi Entegrasyonu ---
    { category_id: 7, title: 'İş Etki Analizi (BIA)', english_term_authoritative: 'Business Impact Analysis (BIA)', related_keywords: 'business continuity, bcp, rto, rpo, critical business functions, risk management', description: 'Bir siber olayın iş süreçlerine finansal/operasyonel etkilerini analiz etme süreci.' },
    { category_id: 7, title: 'Risk İştahı ve Toleransı', english_term_authoritative: 'Risk Appetite and Tolerance', related_keywords: 'risk management framework, grc, business strategy, risk acceptance, strategic decision', description: 'Bir kurumun hedeflerine ulaşmak için bilinçli olarak ne kadar risk almayı kabul ettiğinin tanımlanması.' },
    { category_id: 7, title: 'Siber Güvenlik Metrikleri (KPIs & KRIs)', english_term_authoritative: 'Cybersecurity Metrics (KPIs & KRIs)', related_keywords: 'key performance indicator, key risk indicator, reporting, dashboard, security program effectiveness, measurement', description: 'Güvenlik programının etkinliğini ölçen kilit performans ve kilit risk göstergeleri.' },
    { category_id: 7, title: 'Siber Sigorta (Cyber Insurance)', english_term_authoritative: 'Cyber Insurance', related_keywords: 'risk transfer, financial impact, incident response costs, policy, premium, cyber liability', description: 'Siber olayların finansal etkilerini azaltmak için kullanılan sigorta poliçeleri.' },
    { category_id: 7, title: 'Birleşme ve Devralma (M&A) Durum Tespiti', english_term_authoritative: 'Mergers and Acquisitions (M&A) Due Diligence', related_keywords: 'mergers and acquisitions, risk assessment, security posture assessment, integration, pre-acquisition audit', description: 'Devralınacak şirketin siber güvenlik risklerinin ve duruşunun incelenmesi.' },

    // --- Kategori: Proaktif Savunma ve Tehdit Nötralizasyonu ---
    { category_id: 1, title: '"İhlal Varsayımı" Zihniyeti (Assume Breach)', english_term_authoritative: 'Assume Breach Mindset', related_keywords: 'zero trust, proactive defense, threat hunting, incident detection, inside threat, lateral movement', description: '"Sistemlerimiz zaten ele geçirilmiş olabilir" varsayımıyla içerideki tehditleri sürekli arama felsefesi.' },
    { category_id: 1, title: 'Tehdit Avcılığı Olgunluk Modeli', english_term_authoritative: 'Threat Hunting Maturity Model', related_keywords: 'thmm, proactive detection, hypothesis-driven hunting, soc maturity, sans', description: 'Bir kurumun tehdit avcılığı yeteneklerinin seviyesini (reaktiften proaktife) belirleyen model.' },
    { category_id: 1, title: 'Siber Aldatma ve Yemleme (Honeypots)', english_term_authoritative: 'Cyber Deception & Honeypots', related_keywords: 'deception technology, honeynet, honeytoken, adversary engagement, threat intelligence, attacker deception', description: 'Saldırganları gerçek sistemlerden uzak tutmak ve TTP\'lerini öğrenmek için kurulan tuzak sistemler.' },
    { category_id: 1, title: 'Saldırgan Emülasyonu (Adversary Emulation)', english_term_authoritative: 'Adversary Emulation', related_keywords: 'adversary simulation, red teaming, mitre att&ck, ttps, control validation, atomic red team', description: 'Belirli bir tehdit aktörünün TTP\'lerini taklit ederek savunma kontrollerinin etkinliğini test etme.' },
    { category_id: 1, title: 'İstihbarat Odaklı Savunma', english_term_authoritative: 'Intelligence-Driven Defense', related_keywords: 'cyber threat intelligence, cti, proactive security, risk prioritization, security operations, threat-informed defense', description: 'Siber tehdit istihbaratını (CTI) kullanarak savunma mekanizmalarını ve öncelikleri belirleme stratejisi.' },

    // --- Kategori: Veri Odaklı Güvenlik ve Gizlilik Yaşam Döngüsü ---
    { category_id: 3, title: 'Veri Sınıflandırma ve Etiketleme', english_term_authoritative: 'Data Classification and Labeling', related_keywords: 'data loss prevention, dlp, data governance, sensitive data, pii, phi, information protection', description: 'Verinin hassasiyet seviyesine göre (Gizli, Özel vb.) sınıflandırılması ve politika uygulanması.' },
    { category_id: 3, title: 'Bilgi Hakları Yönetimi (IRM/DRM)', english_term_authoritative: 'Information Rights Management (IRM/DRM)', related_keywords: 'digital rights management, encryption, access control, persistent protection, data-centric security', description: 'Dosyalara şifreleme ve erişim kuralları gömerek yetkisiz erişimi engelleyen teknolojiler.' },
    { category_id: 3, title: 'Veritabanı Aktivite İzleme (DAM)', english_term_authoritative: 'Database Activity Monitoring (DAM)', related_keywords: 'database security, sql monitoring, insider threat, compliance, data breach prevention', description: 'Veritabanlarına yapılan tüm erişimleri ve sorguları izleyerek anomali tespiti.' },
    { category_id: 3, title: 'Tasarım Yoluyla Gizlilik (Privacy by Design)', english_term_authoritative: 'Privacy by Design', related_keywords: 'pbd, privacy engineering, data minimization, proactive privacy, gdpr, privacy by default', description: 'Gizlilik gereksinimlerini en başından tasarım sürecine dahil etme prensibi.' },

    // --- Kategori: Siber-Fiziksel Sistemler ve Bütünleşik Güvenlik ---
    { category_id: 6, title: 'Bütünleşik SOC (Converged SOC)', english_term_authoritative: 'Converged SOC', related_keywords: 'it-ot convergence, physical security, ics monitoring, holistic security view, siem, soapa', description: 'BT, OT ve Fiziksel Güvenlik alarmlarını tek bir merkezden izleyen yapı.' },
    { category_id: 6, title: 'Tedarik Zinciri Güvenliği', english_term_authoritative: 'Supply Chain Security', related_keywords: 'software supply chain, hardware supply chain, sbom, third-party risk, tprm, vendor integrity', description: 'Donanım ve yazılım ürünlerinin üretiminden teslimatına kadar olan süreçte güvenliğin sağlanması.' },
    { category_id: 6, title: 'İç Tehdit Programı Yönetimi', english_term_authoritative: 'Insider Threat Program Management', related_keywords: 'ueba, user behavior analytics, hr, legal, technical controls, malicious insider, negligent insider', description: 'Teknoloji, İK ve psikolojik faktörleri bir araya getiren yapısal bir programla iç tehditlerle mücadele.' },

    // --- Kategori: Güvenlik Orkestrasyonu, Otomasyon ve Müdahale (SOAR) ---
    { category_id: 6, title: 'SOAR Platformları', english_term_authoritative: 'SOAR Platforms', related_keywords: 'splunk soar, palo alto xsoar, demisto, fortisoar, security automation, orchestration, playbook', description: 'Güvenlik operasyonlarını merkezileştiren ve otomatikleştiren platformlar (Splunk SOAR, Palo Alto XSOAR vb.).' },
    { category_id: 6, title: 'API Entegrasyonları (SOAR)', english_term_authoritative: 'API Integrations (SOAR)', related_keywords: 'connectors, security ecosystem, interoperability, playbook automation, api security', description: 'SIEM, EDR, TIP, Firewall gibi farklı güvenlik araçlarının birbiriyle konuşmasını sağlama.' },
    { category_id: 6, title: 'Vaka Yönetimi (Case Management)', english_term_authoritative: 'Case Management', related_keywords: 'incident management, ticketing system, soc workflow, documentation, investigation tracking', description: 'Bir güvenlik olayının tespitinden çözümüne kadar olan tüm yaşam döngüsünü yönetme ve belgeleme.' },
    
    // --- Kategori: Güvenlik Programı Olgunluğu ve Kantitatif Risk Yönetimi ---
    { category_id: 7, title: 'Yetkinlik Olgunluk Modelleri (CMM)', english_term_authoritative: 'Capability Maturity Models (CMM)', related_keywords: 'process improvement, maturity level, assessment, security program maturity, cmmc, cmm', description: 'Bir organizasyonun güvenlik süreçlerinin ne kadar olgun olduğunu 1\'den 5\'e kadar derecelendiren modeller.' },
    { category_id: 7, title: 'Kantitatif Risk Analizi (FAIR™)', english_term_authoritative: 'Quantitative Risk Analysis (FAIR™)', related_keywords: 'factor analysis of information risk, financial risk, loss event frequency, monte carlo simulation, risk quantification', description: 'Siber riskleri "yüksek, orta, düşük" yerine parasal değerlerle ifade etmeyi sağlayan standart model.' },
    { category_id: 7, title: 'Kanıta Dayalı Güvenlik', english_term_authoritative: 'Evidence-Based Security', related_keywords: 'data-driven security, metrics, return on security investment, rosi, security validation', description: 'Güvenlik yatırımlarının etkinliğinin varsayımlara değil, somut verilere dayalı değerlendirilmesi.' },
    { category_id: 7, title: 'Mor Takım (Purple Team) Tatbikatları', english_term_authoritative: 'Purple Team Exercises', related_keywords: 'collaborative security, red team, blue team, ttps, control validation, continuous security improvement', description: 'Kırmızı ve Mavi takımların iş birliğiyle savunma kontrollerinin etkinliğini sürekli ölçtüğü tatbikatlar.' },
    
    // --- Kategori: Düşman Ekonomisi ve Geleceğin Tehdit Vektörleri ---
    { category_id: 6, title: 'Hizmet Olarak Fidye Yazılımı (RaaS)', english_term_authoritative: 'Ransomware-as-a-Service (RaaS)', related_keywords: 'cybercrime ecosystem, affiliate model, dark web, ransomware gangs, initial access broker', description: 'Teknik bilgisi az olan suçluların bile fidye yazılımı saldırıları yapmasını sağlayan "ortaklık" modelleri.' },
    { category_id: 6, title: 'İlk Erişim Aracısı (IAB)', english_term_authoritative: 'Initial Access Broker (IAB)', related_keywords: 'cybercrime marketplace, stolen credentials, rdp access, vpn access, ransomware supply chain', description: 'Şirket ağlarına sızıp, bu erişimi diğer suçlulara satan yeraltı pazarı.' },
    { category_id: 6, title: 'Otonom Saldırı Araçları', english_term_authoritative: 'Autonomous Attack Tools', related_keywords: 'ai-powered attacks, adaptive malware, automated hacking, autonomous pentesting, future of malware', description: 'Savunma sistemlerini insan müdahalesi olmadan, yapay zeka kullanarak aşabilen akıllı zararlı yazılımlar.' },
    { category_id: 6, title: 'Beyin-Bilgisayar Arayüzleri (BCI) Güvenliği', english_term_authoritative: 'Brain-Computer Interface (BCI) Security', related_keywords: 'neurosecurity, biohacking, mental privacy, cognitive threats, emerging technology', description: 'Düşünce gücüyle cihazları kontrol etmeyi sağlayan teknolojilerin hacklenmesi ve zihinsel gizlilik riskleri.' },
    { category_id: 6, title: 'Uzay Sistemleri Güvenliği', english_term_authoritative: 'Space Systems Security', related_keywords: 'satellite hacking, ground station security, gps spoofing, aerospace cybersecurity, space cybersecurity', description: 'Uyduların, yer kontrol istasyonlarının ve uzay görevlerinin siber güvenliği.' },
    { category_id: 6, title: 'Sentetik Biyoloji ve Biyohacking', english_term_authoritative: 'Synthetic Biology and Biohacking', related_keywords: 'dna synthesis, bioterrorism, genetic data security, biosecurity, emerging threats', description: 'Biyolojik verilerin ve süreçlerin dijital olarak manipüle edilmesinin getireceği güvenlik riskleri.' }
];
// *********************************************************************************
// YUKARIDAKİ BÖLÜME KENDİ VERİ DİZİLERİNİZİ EKLEDİĞİNİZDEN EMİN OLUN
// *********************************************************************************

const allConcepts = [...concepts, ...advancedConcepts, ...extraAdvancedConcepts];

// DigitalOcean, DATABASE_URL değişkenini otomatik olarak sağlar.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// Veritabanı tablolarını oluşturan ve verileri ekeleyen fonksiyon
const initializeDb = async () => {
  const client = await pool.connect();
  console.log("PostgreSQL veritabanına başarıyla bağlanıldı.");

  try {
    // --- 1. Tabloları Oluştur (PostgreSQL uyumlu) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY, 
        title TEXT, 
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS concepts (
        id SERIAL PRIMARY KEY, 
        title TEXT, 
        description TEXT, 
        category_id INTEGER,
        english_term_authoritative TEXT, 
        related_keywords TEXT, 
        FOREIGN KEY(category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS historical_events (
        id SERIAL PRIMARY KEY,
        event_date TEXT NOT NULL,
        title_tr TEXT NOT NULL,
        title_en TEXT NOT NULL,
        narrative_tr TEXT NOT NULL,
        narrative_en TEXT NOT NULL,
        significance_tr TEXT,
        significance_en TEXT
      );

      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS technologies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS methods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS event_people_link (
        event_id INTEGER NOT NULL,
        person_id INTEGER NOT NULL,
        FOREIGN KEY(event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
        FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, person_id)
      );

      CREATE TABLE IF NOT EXISTS event_technologies_link (
        event_id INTEGER NOT NULL,
        technology_id INTEGER NOT NULL,
        FOREIGN KEY(event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
        FOREIGN KEY(technology_id) REFERENCES technologies(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, technology_id)
      );

      CREATE TABLE IF NOT EXISTS event_methods_link (
        event_id INTEGER NOT NULL,
        method_id INTEGER NOT NULL,
        FOREIGN KEY(event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
        FOREIGN KEY(method_id) REFERENCES methods(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, method_id)
      );

      CREATE TABLE IF NOT EXISTS event_sources_link (
        event_id INTEGER NOT NULL,
        source_id INTEGER NOT NULL,
        FOREIGN KEY(event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
        FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, source_id)
      );
    `);
    console.log("Tüm tablolar başarıyla oluşturuldu veya zaten mevcuttu.");

    // --- 2. Verileri Ekle (Sadece veritabanı boşsa) ---
    const { rows } = await client.query('SELECT COUNT(*) as count FROM categories');
    if (rows[0].count == 0) {
      console.log("Veritabanı boş, kategoriler ve temel kavramlar ekleniyor...");

      // Kategorileri Ekle
      for (const cat of categories) {
        await client.query(
          'INSERT INTO categories (id, title, description) VALUES ($1, $2, $3)',
          [cat.id, cat.title, cat.description]
        );
      }
      console.log("Kategoriler başarıyla eklendi.");

      // Kavramları Ekle
      for (const con of allConcepts) {
        await client.query(
          'INSERT INTO concepts (title, description, category_id, english_term_authoritative, related_keywords) VALUES ($1, $2, $3, $4, $5)',
          [con.title, con.description, con.category_id, con.english_term_authoritative, con.related_keywords || null]
        );
      }
      console.log(`Tüm kavramlar başarıyla eklendi. Toplam ${allConcepts.length} adet.`);

    } else {
      console.log("Veritabanı zaten dolu, veri ekleme adımı atlandı.");
    }

  } catch (err) {
    console.error("Veritabanı başlatma/veri ekleme hatası:", err);
  } finally {
    client.release();
  }
};

// Dışarıya `query` fonksiyonunu (sorgu yapmak için) ve `initializeDb` (başlatmak için) aktarıyoruz
module.exports = {
  query: (text, params) => pool.query(text, params),
  initializeDb: initializeDb
};