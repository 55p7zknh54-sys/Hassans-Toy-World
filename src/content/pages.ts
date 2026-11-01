/**
 * Text for the information pages (About, Delivery, Returns, Privacy, Terms, Contact).
 * These are sensible starting drafts — read them and edit them to match your REAL policies before launch.
 */
type L = { en: string; ar: string };
export type InfoPage = { title: L; intro?: L; sections: { h: L; p: L }[] };

export const INFO_PAGES: Record<string, InfoPage> = {
  about: {
    title: { en: "About Hassan's Toys World", ar: 'عن عالم حسن للألعاب' },
    intro: {
      en: 'Small toys. Big smiles! We bring trending squishies, plushies, collectibles and fidget toys to families across Iraq.',
      ar: 'ألعاب صغيرة. ابتسامات كبيرة! نوفّر أحدث السكويشي والدمى والمقتنيات وألعاب الفيدجت للعوائل بكل أنحاء العراق.',
    },
    sections: [
      { h: { en: 'What we do', ar: 'شنو نسوّي' }, p: { en: 'We carefully choose popular toys that kids, teenagers and gift-buying parents love, and sell them through this online store with delivery to every governorate.', ar: 'نختار بعناية الألعاب الرائجة اللي يحبها الأطفال والمراهقين والأهل اللي يشترون هدايا، ونبيعها من خلال هذا المتجر مع توصيل لكل المحافظات.' } },
      { h: { en: 'How ordering works', ar: 'شلون يشتغل الطلب' }, p: { en: 'Pick your toys, enter your delivery details, and confirm. You pay in cash when the order arrives. Our team contacts you to confirm every order before it is sent.', ar: 'اختر ألعابك، أدخل بيانات التوصيل، وأكّد الطلب. تدفع كاش لما يوصلك الطلب. فريقنا يتواصل وياك لتأكيد كل طلب قبل إرساله.' } },
    ],
  },
  delivery: {
    title: { en: 'Delivery information', ar: 'معلومات التوصيل' },
    intro: { en: 'We deliver to every governorate in Iraq. You pay the delivery fee together with your order, in cash, on delivery.', ar: 'نوصّل لكل محافظات العراق. أجرة التوصيل تُدفع مع الطلب كاش عند الاستلام.' },
    sections: [
      { h: { en: 'Delivery fees', ar: 'أجور التوصيل' }, p: { en: 'The fee depends on your governorate. The exact amount is shown at checkout before you confirm your order (see the table below).', ar: 'الأجرة تعتمد على محافظتك. المبلغ بالضبط يظهر لك عند إتمام الطلب قبل التأكيد (شوف الجدول أدناه).' } },
      { h: { en: 'Order confirmation', ar: 'تأكيد الطلب' }, p: { en: 'Every order starts as “pending”. Our team contacts you by phone or WhatsApp to confirm it, and we only dispatch confirmed orders. For some large orders we may ask for a small deposit first.', ar: 'كل طلب يبدأ بحالة «قيد الانتظار». فريقنا يتصل بيك أو يراسلك على واتساب لتأكيده، ونرسل الطلبات المؤكدة فقط. وببعض الطلبات الكبيرة ممكن نطلب عربون صغير أولاً.' } },
      { h: { en: 'On delivery', ar: 'عند الاستلام' }, p: { en: 'Please keep your phone on and have the cash ready. The courier will call you before arriving. If nobody can receive the order, the courier may try again or contact us.', ar: 'خلّي تلفونك مفتوح وجهّز المبلغ كاش. المندوب راح يتصل بيك قبل ما يوصل. إذا ما كو أحد يستلم، ممكن المندوب يعيد المحاولة أو يتواصل وياناً.' } },
    ],
  },
  returns: {
    title: { en: 'Return policy', ar: 'سياسة الإرجاع' },
    sections: [
      { h: { en: 'Damaged or wrong items', ar: 'منتج تالف أو غلط' }, p: { en: 'If your order arrives damaged, faulty or different from what you ordered, contact us as soon as you receive it with a photo, and we will arrange a replacement or refund.', ar: 'إذا وصلك الطلب تالف أو فيه عيب أو يختلف عن اللي طلبته، تواصل وياناً حال الاستلام مع صورة، وراح نرتب بديل أو استرجاع المبلغ.' } },
      { h: { en: 'Check on arrival', ar: 'افحص عند الاستلام' }, p: { en: 'Where possible, open the parcel in front of the courier to check it.', ar: 'إذا أمكن، افتح الطرد قدام المندوب وافحصه.' } },
      { h: { en: 'Surprise items', ar: 'المنتجات المفاجأة' }, p: { en: 'Mystery boxes and blind bags contain surprise items, so receiving a design you did not hope for is not a reason for return.', ar: 'صناديق وأكياس المفاجآت محتواها مفاجأة، لذلك الحصول على تصميم ما كنت تتمناه ما يعتبر سبب للإرجاع.' } },
    ],
  },
  privacy: {
    title: { en: 'Privacy policy', ar: 'سياسة الخصوصية' },
    sections: [
      { h: { en: 'What we collect', ar: 'شنو نجمع' }, p: { en: 'When you order we collect your name, phone number, governorate, city, address and the items you ordered. If you write a review we also keep the phone number you enter, privately.', ar: 'عند الطلب نجمع اسمك ورقم هاتفك ومحافظتك ومدينتك وعنوانك والمنتجات اللي طلبتها. وإذا كتبت تقييماً نحتفظ برقم الهاتف اللي تدخله بشكل خاص.' } },
      { h: { en: 'How we use it', ar: 'شلون نستخدمها' }, p: { en: 'Only to confirm and deliver your order, contact you about it, prevent fake orders and improve our service. We do not sell your information.', ar: 'فقط لتأكيد طلبك وتوصيله والتواصل وياك بخصوصه ومنع الطلبات الوهمية وتحسين خدمتنا. ما نبيع معلوماتك.' } },
      { h: { en: 'Who can see it', ar: 'منو يگدر يشوفها' }, p: { en: 'Only our authorised team, and the courier who delivers your order. Order data is protected in our database and is never shown publicly.', ar: 'فقط فريقنا المخوّل والمندوب اللي يوصّل طلبك. بيانات الطلب محمية بقاعدة بياناتنا وما تظهر للعامة أبداً.' } },
      { h: { en: 'Your choices', ar: 'خياراتك' }, p: { en: 'You can ask us to correct or delete your information by contacting us.', ar: 'تگدر تطلب منا تصحيح أو حذف معلوماتك بالتواصل وياناً.' } },
    ],
  },
  terms: {
    title: { en: 'Terms & conditions', ar: 'الشروط والأحكام' },
    sections: [
      { h: { en: 'Orders', ar: 'الطلبات' }, p: { en: 'An order is a request to buy. It becomes final when our team confirms it. We may decline or cancel an order, for example if an item is unavailable or we cannot reach you.', ar: 'الطلب هو طلب شراء، ويصير نهائياً عند تأكيده من فريقنا. يحق لنا رفض أو إلغاء طلب، مثلاً إذا المنتج غير متوفر أو ما گدرنا نتواصل وياك.' } },
      { h: { en: 'Prices and payment', ar: 'الأسعار والدفع' }, p: { en: 'All prices are in Iraqi Dinar (IQD). Payment is in cash on delivery: the price of the products plus the delivery fee shown at checkout.', ar: 'جميع الأسعار بالدينار العراقي. الدفع كاش عند الاستلام: سعر المنتجات زائد أجرة التوصيل الظاهرة عند إتمام الطلب.' } },
      { h: { en: 'Product images', ar: 'صور المنتجات' }, p: { en: 'We try to show products accurately. Colours and designs may vary slightly.', ar: 'نحاول نعرض المنتجات بدقة. الألوان والتصاميم ممكن تختلف شوية.' } },
      { h: { en: 'Fake or abusive orders', ar: 'الطلبات الوهمية' }, p: { en: 'We may block numbers that place fake orders or repeatedly refuse deliveries.', ar: 'يحق لنا حظر الأرقام اللي ترسل طلبات وهمية أو ترفض الاستلام بشكل متكرر.' } },
    ],
  },
  contact: {
    title: { en: 'Contact us', ar: 'اتصل بنا' },
    intro: { en: 'Questions about a toy or an order? We are happy to help.', ar: 'عندك سؤال عن لعبة أو طلب؟ يسعدنا نساعدك.' },
    sections: [],
  },
};
