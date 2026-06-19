const { data: products, error } = await supabase
  .from('products')
  .select('*');

console.log('ERROR:', error);
console.log('PRODUCTS:', products);return (
  <main>
    <pre>
      {JSON.stringify(
        {
          error,
          count: products?.length,
          products,
        },
        null,
        2
      )}
    </pre>
  </main>
);

return (
  <main>
    <pre>
      {JSON.stringify(
        {
          error,
          count: products?.length,
          products,
        },
        null,
        2
      )}
    </pre>
  </main>
);
