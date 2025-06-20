// src/data/foodieGroups.js
import chapelHillBanner from '@/assets/images/chapel-hill.jpg';
import wncBanner       from '@/assets/images/R9A5610.jpg';
import charlotteBanner from '@/assets/images/charlotte.jpg';
import raleighBanner   from '@/assets/images/raleigh.jpg';

export default [
  {
    id: 1,
    name: "Chapel Hill Carrboro Foodies",
    description: "Exclusive deals for Chapel Hill and Carrboro food enthusiasts.",
    location: "Chapel Hill, NC",
    foodieGroup: "chapel hill",
    bannerImage: chapelHillBanner,
    mapCoordinates: {
      lat: 35.9132,
      lng: -79.0558
    },
    socialMedia: {
      facebook: "https://www.facebook.com/groups/chcfoodies/",
      instagram: "https://www.instagram.com/chcbfoodies/",
      twitter: "https://twitter.com/ChapelHillEats"
    }
  },
  {
    id: 2,
    name: "WNC Foodies",
    description: "Discover the best local deals and dining experiences in Western NC.",
    location: "Boone, NC",
    foodieGroup: "wnc",
    bannerImage: wncBanner,
    mapCoordinates: {
      lat: 36.2164,
      lng: -81.6749
    },
    socialMedia: {
      facebook: "https://www.facebook.com/groups/wncfoodies/",
      instagram: "",
      twitter: ""
    }
  },
  {
    id: 3,
    name: "Charlotte Foodie Group",
    description: "Discover the best local deals and dining experiences in Charlotte.",
    location: "Charlotte, NC",
    foodieGroup: "charlotte",
    bannerImage: charlotteBanner,
    mapCoordinates: {
      lat: 35.2271,
      lng: -80.8431
    },
    socialMedia: {
      facebook: "https://facebook.com/CharlotteFoodieGroup",
      instagram: "https://instagram.com/CharlotteFoodieGroup",
      twitter: "https://twitter.com/CharlotteFoodieGroup"
    }
  },
  {
    id: 4,
    name: "Raleigh Bites",
    description: "Your guide to the hottest restaurants and exclusive offers in Raleigh.",
    location: "Raleigh, NC",
    foodieGroup: "raleigh",
    bannerImage: raleighBanner,
    mapCoordinates: {
      lat: 35.7796,
      lng: -78.6382
    },
    socialMedia: {
      facebook: "https://facebook.com/RaleighBites",
      instagram: "https://instagram.com/RaleighBites",
      twitter: "https://twitter.com/RaleighBites"
    }
  }
];
