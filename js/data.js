const attractions = [
    { id: 'a1', tag: 'Lighthouse Bay', category: 'Landmarks', title: 'Old Maritime Lighthouse', text: 'Priority access and panoramic tower entry included.', img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=600&auto=format&fit=crop' },
    { id: 'a2', tag: 'Cove Beach', category: 'Beaches', title: 'Secret Emerald Cove', text: 'Private beach resort entry with reserved sunbeds.', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop' },
    { id: 'a3', tag: 'Coral Reefs', category: 'Marine', title: 'Marine Sanctuary & Aquarium', text: 'Guided snorkeling gear rental and entry tickets.', img: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=600&auto=format&fit=crop' },
    { id: 'a4', tag: 'Island Hop', category: 'Beaches', title: 'Crystal Blue Lagoons', text: 'Secluded turquoise beaches reserved for pass holders.', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { id: 'a5', tag: 'Heritage', category: 'Landmarks', title: 'Historic Harbor Old Town', text: 'Centuries-old alleys, seafood markets and seaside promenades.', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
    { id: 'a6', tag: 'Luxury Cruise', category: 'Marine', title: 'Sunset Catamaran Pier', text: 'Complimentary evening cruise with views of the golden horizon.', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' }
];

const experiences = [
    { id: 'e1', tag: 'Daily Cruise', category: 'Cruise', title: 'High-Speed Ferry Hop', text: 'Unlimited free rides across 4 major coastal islands.', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop' },
    { id: 'e2', tag: 'Culinary', category: 'Culinary', title: 'Seafood Tasting Tour', text: 'Exclusive discounts at 20+ partner seaside restaurants.', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop' },
    { id: 'e3', tag: 'Evening Cruise', category: 'Cruise', title: 'Sunset Catamaran Tour', text: 'A relaxing cruise with panoramic views of the golden horizon.', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
    { id: 'e4', tag: 'Adventure', category: 'Adventure', title: 'Guided Snorkeling Safari', text: 'Explore coral reefs with certified guides and free gear rental.', img: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=600&auto=format&fit=crop' }
];

const destinations = [
    { tag: 'Island Hop', title: 'Crystal Blue Lagoons', text: 'Sail through pristine turquoise waters and access secluded beaches reserved for pass holders.', more: 'Boats leave every 30 minutes from the main harbor. Bring sunscreen and a towel.', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { tag: 'Heritage', title: 'Historic Coastal Towns', text: 'Walk through centuries-old alleys, local seafood markets, and scenic seaside promenades.', more: 'Free guided walking tours start at 10:00 and 16:00 for pass holders.', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
    { tag: 'Luxury Cruise', title: 'Sunset Catamaran Tours', text: 'Enjoy complimentary evening cruises with panoramic views of the golden horizon.', more: 'Departures are one hour before sunset. Included with the 7-Day pass.', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' }
];

const passes = [
    { id: '3day', popular: true, label: 'Most Popular', name: '3-Day Coastal Pass', price: 79, perks: ['Access to 65+ Coastal Spots', 'Priority Ferry Boarding', '24/7 Digital Concierge'] },
    { id: '7day', popular: false, label: 'Ultimate Escape', name: '7-Day All-Access Pass', price: 129, perks: ['All 3-Day Pass Benefits', 'Free Sunset Catamaran Cruise', 'VIP Restaurant Discounts'] }
];

const durations = [
    { id: '1', label: '1 Day Explorer', days: 1, price: 39 },
    { id: '3', label: '3 Days Coastal Pass', days: 3, price: 79 },
    { id: '7', label: '7 Days Ultimate Escape', days: 7, price: 129 }
];

const activities = [
    { id: 'ferries', label: 'Island Ferries', extra: 0, checked: true },
    { id: 'lighthouses', label: 'Lighthouses', extra: 0, checked: true },
    { id: 'snorkeling', label: 'Snorkeling', extra: 15, checked: false },
    { id: 'seafood', label: 'Seafood Dining', extra: 0, checked: true }
];

const faqs = [
    { q: 'How do I receive my pass?', a: 'Right after payment your digital pass is delivered to your email and your phone.' },
    { q: 'Can I use the pass on any day?', a: 'Yes. The days start counting from the first scan, so you can pick any date.' },
    { q: 'Are children included?', a: 'Children under 6 travel for free when accompanied by a pass holder.' }
];

const coastalSpots = [
    { id: 'split', name: 'Split', country: 'Croatia', region: 'Europe', lat: 43.5081, lon: 16.4402 },
    { id: 'dubrovnik', name: 'Dubrovnik', country: 'Croatia', region: 'Europe', lat: 42.6507, lon: 18.0944 },
    { id: 'santorini', name: 'Santorini', country: 'Greece', region: 'Europe', lat: 36.3932, lon: 25.4615 },
    { id: 'amalfi', name: 'Amalfi Coast', country: 'Italy', region: 'Europe', lat: 40.6340, lon: 14.6027 },
    { id: 'algarve', name: 'Algarve (Faro)', country: 'Portugal', region: 'Europe', lat: 37.0194, lon: -7.9304 },
    { id: 'phuket', name: 'Phuket', country: 'Thailand', region: 'Asia', lat: 7.8804, lon: 98.3923 },
    { id: 'bali', name: 'Bali (Kuta)', country: 'Indonesia', region: 'Asia', lat: -8.7184, lon: 115.1686 },
    { id: 'maldives', name: 'Malé Atoll', country: 'Maldives', region: 'Asia', lat: 4.1755, lon: 73.5093 },
    { id: 'cancun', name: 'Cancún', country: 'Mexico', region: 'Americas', lat: 21.1619, lon: -86.8515 },
    { id: 'miami', name: 'Miami Beach', country: 'USA', region: 'Americas', lat: 25.7907, lon: -80.1300 },
    { id: 'goldcoast', name: 'Gold Coast', country: 'Australia', region: 'Oceania', lat: -28.0167, lon: 153.4000 },
    { id: 'bora', name: 'Bora Bora', country: 'Fr. Polynesia', region: 'Oceania', lat: -16.5004, lon: -151.7415 }
];
