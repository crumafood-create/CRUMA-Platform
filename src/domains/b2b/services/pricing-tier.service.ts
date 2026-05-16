export function getTierDiscount(
  tier: string
) {

  switch (tier) {

    case 'gold':
      return 0.20;

    case 'silver':
      return 0.10;

    default:
      return 0;
  }
}
