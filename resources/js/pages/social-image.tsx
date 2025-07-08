import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

interface SocialImageProps {
  offer: {
    id: string;
    name: string;
    description: string;
    product_image?: {
      url: string;
    } | null;
    status: string;
  };
  organization: {
    name: string;
    description: string;
    primary_color: string;
    logo_media?: {
      url: string;
    } | null;
  };
  theme?: {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
  } | null;
  items: Array<{
    name: string;
    description: string;
    prices: Array<{
      amount: number;
      currency: string;
      formatted: string;
    }>;
  }>;
  hosted_page?: {
    logo_image?: {
      url: string;
    } | null;
    background_image?: {
      url: string;
    } | null;
    style?: Record<string, unknown>;
  } | null;
  timestamp: number;
}

export default function SocialImagePage({ offer, organization, theme, items, hosted_page }: SocialImageProps) {
  // Optimize for responsive social media sizes - full screen
  const containerStyle = useMemo(() => ({
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    overflow: 'hidden',
    fontFamily: theme?.font_family || 'Inter, system-ui, sans-serif',
    backgroundColor: theme?.background_color || '#ffffff',
    color: theme?.text_color || '#1f2937',
  }), [theme]);

  const backgroundStyle = useMemo(() => {
    if (hosted_page?.background_image?.url) {
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${hosted_page.background_image.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.1,
        zIndex: 0,
      };
    }
    return {};
  }, [hosted_page?.background_image?.url]);

  const primaryColor = theme?.primary_color || organization?.primary_color || '#3b82f6';
  const secondaryColor = theme?.secondary_color || '#6b7280';

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div style={containerStyle}>
        {/* Background Image Overlay */}
        {hosted_page?.background_image?.url && (
          <div style={backgroundStyle} />
        )}

        {/* Main Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '80px',
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}05 100%)`,
        }}>
          
          {/* Header Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '60px',
          }}>
            {/* Organization Logo/Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              {hosted_page?.logo_image?.url ? (
                <img 
                  src={hosted_page.logo_image.url} 
                  alt={organization.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                  }}
                />
              ) : organization.logo_media?.url ? (
                <img 
                  src={organization.logo_media.url} 
                  alt={organization.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  backgroundColor: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  {organization.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: primaryColor,
                  marginBottom: '4px',
                }}>
                  {organization.name}
                </div>
                <div style={{
                  fontSize: '18px',
                  color: secondaryColor,
                }}>
                  Secure Checkout
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div style={{
            display: 'flex',
            flex: 1,
            gap: '80px',
            alignItems: 'center',
          }}>
            
            {/* Left Side - Product Info */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>
              {/* Offer Title */}
              <div>
                <h1 style={{
                  fontSize: '64px',
                  fontWeight: '700',
                  lineHeight: '1.1',
                  margin: 0,
                  marginBottom: '24px',
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {offer.name}
                </h1>
                
                {offer.description && (
                  <p style={{
                    fontSize: '32px',
                    lineHeight: '1.4',
                    color: secondaryColor,
                    margin: 0,
                    maxWidth: '600px',
                  }}>
                    {offer.description}
                  </p>
                )}
              </div>

              {/* Pricing */}
              {items.length > 0 && items[0].prices.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    fontWeight: '600',
                    color: primaryColor,
                  }}>
                    {items[0].prices[0].formatted}
                  </span>
                  {items[0].prices.length > 1 && (
                    <span style={{
                      fontSize: '24px',
                      color: secondaryColor,
                    }}>
                      starting at
                    </span>
                  )}
                </div>
              )}

              {/* Features/Items */}
              {items.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {items.slice(0, 3).map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: primaryColor,
                      }} />
                      <span style={{
                        fontSize: '24px',
                        fontWeight: '500',
                      }}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div style={{
                      fontSize: '20px',
                      color: secondaryColor,
                      marginLeft: '24px',
                    }}>
                      +{items.length - 3} more items
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Product Image */}
            {offer.product_image?.url && (
              <div style={{
                flex: '0 0 500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  position: 'relative',
                  width: '450px',
                  height: '450px',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: `0 30px 60px ${primaryColor}20`,
                  border: `6px solid ${primaryColor}20`,
                }}>
                  <img 
                    src={offer.product_image.url} 
                    alt={offer.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: `linear-gradient(transparent, ${primaryColor}20)`,
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '60px',
            paddingTop: '32px',
            borderTop: `3px solid ${primaryColor}20`,
          }}>
            <div style={{
              fontSize: '20px',
              color: secondaryColor,
            }}>
              Powered by Plandalf
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '20px',
              color: secondaryColor,
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite',
              }} />
              Secure Payment Processing
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </>
  );
} 