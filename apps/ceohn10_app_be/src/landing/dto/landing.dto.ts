export class CreateLandingWebDto {
  name!: string;
  slug!: string;
  subdomain?: string;
  template?:
    | 'timed_cards_opening'
    | 'ceohn10_executive'
    | 'startup_mobile_showcase'
    | 'forge_luxury_atelier'
    | 'modern_luxury_estate'
    | 'video_voting_showcase';
}

export class ApplySubdomainDto {
  subdomain!: string;
}

export class CastLandingVideoVoteDto {
  slideId!: string;
  optionId!: string;
  voterName!: string;
  voterEmail!: string;
}

export class TestApiConnectorDto {
  enabled!: boolean;
  endpointUrl!: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  rootPath?: string;
  fieldMapping?: {
    place?: string;
    title1?: string;
    title2?: string;
    description?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}
