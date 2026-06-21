import { Check, Clipboard, Terminal } from "lucide-react";
import { useState } from "react";
import { Dropdown, FieldGroup, Panel } from "../../components/Primitives";
import type { CommandRecipe } from "./securityPlaygroundModel";

type Props = {
  recipes: CommandRecipe[];
  recipeId: string;
  setRecipeId: (value: string) => void;
};

export function SecurityCommandRecipes(props: Props) {
  const activeRecipe =
    props.recipes.find((recipe) => recipe.id === props.recipeId) ??
    props.recipes[0];

  return (
    <Panel className="client-recipe-card security-command-recipes">
      <div className="client-recipe-toolbar">
        <FieldGroup label="Command">
          <Dropdown
            ariaLabel="Command"
            className="client-recipe-select"
            value={activeRecipe.id}
            options={props.recipes.map((recipe) => ({
              value: recipe.id,
              label: recipe.title,
              icon: <Terminal size={16} />,
              searchText: `${recipe.title} ${recipe.description}`,
            }))}
            onChange={props.setRecipeId}
            searchable
          />
        </FieldGroup>
        <CopyButton value={activeRecipe.code} />
      </div>
      <div className="client-recipe-header">
        <span className="client-svg-icon">
          <Terminal size={20} />
        </span>
        <div>
          <h3>{activeRecipe.title}</h3>
          <p>{activeRecipe.description}</p>
        </div>
      </div>
      <pre className="client-code-block code-lang-bash">
        <code>{activeRecipe.code}</code>
      </pre>
    </Panel>
  );
}

function CopyButton(props: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="button"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(props.value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check size={16} /> : <Clipboard size={16} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
