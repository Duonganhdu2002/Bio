import {
  AtSign,
  BookOpen,
  Camera,
  Globe,
  Headphones,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Music,
  Music2,
  Newspaper,
  Phone,
  Play,
  Send,
  ShoppingBag,
  Store,
  ThumbsUp,
} from "lucide-react";

/**
 * Icon theo `links.platform`. Render bằng switch trả JSX literal (không tạo
 * component động trong render) để hợp lệ với React Compiler.
 *
 * Lucide v1.x đã bỏ icon thương hiệu (Instagram/Youtube/Facebook/Twitter),
 * nên map sang icon trung tính gần nghĩa nhất. Khóa lạ → icon link mặc định.
 */
export function PlatformIcon({
  platform,
  className,
}: {
  platform: string | null | undefined;
  className?: string;
}) {
  switch ((platform ?? "").trim().toLowerCase()) {
    case "instagram":
      return <Camera className={className} aria-hidden />;
    case "tiktok":
      return <Music2 className={className} aria-hidden />;
    case "youtube":
      return <Play className={className} aria-hidden />;
    case "facebook":
      return <ThumbsUp className={className} aria-hidden />;
    case "x":
    case "twitter":
    case "threads":
      return <AtSign className={className} aria-hidden />;
    case "telegram":
      return <Send className={className} aria-hidden />;
    case "messenger":
      return <MessagesSquare className={className} aria-hidden />;
    case "zalo":
    case "whatsapp":
      return <MessageCircle className={className} aria-hidden />;
    case "email":
    case "mail":
      return <Mail className={className} aria-hidden />;
    case "phone":
      return <Phone className={className} aria-hidden />;
    case "spotify":
    case "soundcloud":
      return <Music className={className} aria-hidden />;
    case "podcast":
      return <Headphones className={className} aria-hidden />;
    case "shopee":
    case "lazada":
    case "tiki":
      return <ShoppingBag className={className} aria-hidden />;
    case "shop":
    case "store":
      return <Store className={className} aria-hidden />;
    case "blog":
      return <Newspaper className={className} aria-hidden />;
    case "book":
      return <BookOpen className={className} aria-hidden />;
    case "map":
    case "location":
      return <MapPin className={className} aria-hidden />;
    case "website":
    case "web":
      return <Globe className={className} aria-hidden />;
    default:
      return <Link2 className={className} aria-hidden />;
  }
}
